/**
 * Executable proofs of the business invariants advertised in README.md.
 *
 * These are contractual promises to members and enterprise buyers — the 5+5
 * target cap, the 180-day decline cooldown, the named-champion requirement.
 * They are enforced by database triggers and constraints, so they can only be
 * proven by executing SQL against a real PostgreSQL instance.
 *
 * Each test runs inside a transaction that is rolled back, so the suite is
 * order-independent and leaves no residue.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (process.env.CI && !connectionString) {
  throw new Error('DATABASE_URL must be set in CI — business invariant tests cannot be skipped.');
}

let client: pg.Client;

/** Runs `fn` inside a transaction that is always rolled back. */
async function inRollback<T>(fn: () => Promise<T>): Promise<T> {
  await client.query('BEGIN');
  try {
    return await fn();
  } finally {
    await client.query('ROLLBACK');
  }
}

async function createOrg(name: string): Promise<string> {
  const { rows } = await client.query(
    `INSERT INTO public.organizations (name, type) VALUES ($1, 'member') RETURNING id`,
    [name]
  );
  return rows[0].id;
}

async function createTarget(orgId: string, name: string, tier: 'primary' | 'bench') {
  const { rows } = await client.query(
    `INSERT INTO public.account_targets (org_id, name, tier) VALUES ($1, $2, $3) RETURNING id`,
    [orgId, name, tier]
  );
  return rows[0].id;
}

describe.skipIf(!connectionString)('Business invariants (README §Core Invariants)', () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString });
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  describe('Invariant 6: 5 primary + 5 bench target limit', () => {
    it('ALLOWS exactly 5 primary targets', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Limit Org A');
        for (let i = 1; i <= 5; i++) {
          await createTarget(orgId, `Primary ${i}`, 'primary');
        }
        const { rows } = await client.query(
          `SELECT COUNT(*)::int AS n FROM public.account_targets WHERE org_id = $1 AND tier = 'primary'`,
          [orgId]
        );
        expect(rows[0].n).toBe(5);
      });
    });

    it('REJECTS a 6th primary target', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Limit Org B');
        for (let i = 1; i <= 5; i++) {
          await createTarget(orgId, `Primary ${i}`, 'primary');
        }
        await expect(createTarget(orgId, 'Primary 6', 'primary')).rejects.toThrow(
          /cannot exceed 5 primary targets/i
        );
      });
    });

    it('REJECTS a 6th bench target', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Limit Org C');
        for (let i = 1; i <= 5; i++) {
          await createTarget(orgId, `Bench ${i}`, 'bench');
        }
        await expect(createTarget(orgId, 'Bench 6', 'bench')).rejects.toThrow(
          /cannot exceed 5 bench targets/i
        );
      });
    });

    it('REJECTS promoting a bench target to primary when 5 primary already exist', async () => {
      // The trigger originally fired BEFORE INSERT only. Inserting 5 primary +
      // 1 bench and updating the bench row to primary yielded 6 primary targets,
      // silently breaking the contractual cap. Reproduced on a live database
      // before the INSERT OR UPDATE fix.
      await inRollback(async () => {
        const orgId = await createOrg('Update Bypass Org');
        for (let i = 1; i <= 5; i++) await createTarget(orgId, `P${i}`, 'primary');
        const benchId = await createTarget(orgId, 'B1', 'bench');

        // The rejection aborts the surrounding transaction, so the assertion on
        // the resulting row count needs a savepoint to roll back to.
        await client.query('SAVEPOINT before_promotion');
        await expect(
          client.query(`UPDATE public.account_targets SET tier = 'primary' WHERE id = $1`, [benchId])
        ).rejects.toThrow(/cannot exceed 5 primary targets/i);
        await client.query('ROLLBACK TO SAVEPOINT before_promotion');

        const { rows } = await client.query(
          `SELECT COUNT(*)::int AS n FROM public.account_targets WHERE org_id = $1 AND tier = 'primary'`,
          [orgId]
        );
        expect(rows[0].n).toBe(5);
      });
    });

    it('counts primary and bench tiers independently (5+5, not 5 total)', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Limit Org D');
        for (let i = 1; i <= 5; i++) await createTarget(orgId, `P${i}`, 'primary');
        // A bench target must still be allowed after 5 primaries.
        await expect(createTarget(orgId, 'B1', 'bench')).resolves.toBeDefined();
      });
    });

    it('scopes the limit per organization, not globally', async () => {
      await inRollback(async () => {
        const orgA = await createOrg('Scoped Org A');
        const orgB = await createOrg('Scoped Org B');
        for (let i = 1; i <= 5; i++) await createTarget(orgA, `P${i}`, 'primary');
        await expect(createTarget(orgB, 'P1', 'primary')).resolves.toBeDefined();
      });
    });
  });

  describe('Invariant 5: every intro requires a named human champion', () => {
    it('REJECTS an intro with a NULL person_id', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Champion Org');
        const targetId = await createTarget(orgId, 'Acme Corp', 'primary');
        await expect(
          client.query(
            `INSERT INTO public.intros (org_id, account_target_id, person_id, copy)
             VALUES ($1, $2, NULL, 'hello')`,
            [orgId, targetId]
          )
        ).rejects.toThrow(/null value in column "person_id"|not-null/i);
      });
    });
  });

  describe('Invariant 7: 180-day decline cooldown', () => {
    it('sets do_not_contact_until ~180 days out when an intro is declined', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('Cooldown Org');
        const targetId = await createTarget(orgId, 'Globex', 'primary');
        const { rows: personRows } = await client.query(
          `INSERT INTO public.people (account_target_id, name, role)
           VALUES ($1, 'Jane Champion', 'VP Procurement') RETURNING id`,
          [targetId]
        );
        const personId = personRows[0].id;

        const { rows: introRows } = await client.query(
          `INSERT INTO public.intros (org_id, account_target_id, person_id, copy, result)
           VALUES ($1, $2, $3, 'intro copy', 'sent') RETURNING id`,
          [orgId, targetId, personId]
        );

        await client.query(`UPDATE public.intros SET result = 'declined' WHERE id = $1`, [
          introRows[0].id,
        ]);

        const { rows } = await client.query(
          `SELECT EXTRACT(DAY FROM (do_not_contact_until - NOW()))::int AS days_out
           FROM public.people WHERE id = $1`,
          [personId]
        );
        expect(rows[0].days_out).toBeGreaterThanOrEqual(179);
        expect(rows[0].days_out).toBeLessThanOrEqual(180);
      });
    });

    it('does NOT set a cooldown for a non-declined result', async () => {
      await inRollback(async () => {
        const orgId = await createOrg('No Cooldown Org');
        const targetId = await createTarget(orgId, 'Initech', 'primary');
        const { rows: personRows } = await client.query(
          `INSERT INTO public.people (account_target_id, name, role)
           VALUES ($1, 'John Champion', 'Director') RETURNING id`,
          [targetId]
        );
        const personId = personRows[0].id;

        const { rows: introRows } = await client.query(
          `INSERT INTO public.intros (org_id, account_target_id, person_id, copy, result)
           VALUES ($1, $2, $3, 'intro copy', 'sent') RETURNING id`,
          [orgId, targetId, personId]
        );

        await client.query(`UPDATE public.intros SET result = 'met' WHERE id = $1`, [
          introRows[0].id,
        ]);

        const { rows } = await client.query(
          `SELECT do_not_contact_until FROM public.people WHERE id = $1`,
          [personId]
        );
        expect(rows[0].do_not_contact_until).toBeNull();
      });
    });
  });
});
