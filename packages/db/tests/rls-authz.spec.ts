/**
 * Row Level Security authorization tests.
 *
 * These run against a real PostgreSQL database built by
 * scripts/db/apply-migrations.mjs. They impersonate the `authenticated` role
 * and set the request-scoped JWT claim that auth.uid() reads, which is how
 * Supabase evaluates policies at runtime.
 *
 * Every other database "test" in this repository asserts against TypeScript
 * objects or an in-memory mock. This file is the only place where the security
 * properties of the schema are actually exercised, so it deliberately tests the
 * attacks rather than the happy path.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

// Fail closed in CI: a silently skipped authorization suite must never be
// mistaken for a passing one.
if (process.env.CI && !connectionString) {
  throw new Error('DATABASE_URL must be set in CI — RLS authorization tests cannot be skipped.');
}

const MEMBER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ID = '22222222-2222-2222-2222-222222222222';
const ATTACKER_ID = '33333333-3333-3333-3333-333333333333';

let client: pg.Client;

/**
 * Runs `fn` as the `authenticated` role with auth.uid() bound to `uid`,
 * inside a transaction that is always rolled back so tests cannot leak state.
 */
async function asUser<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL ROLE authenticated');
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [uid]);
    await client.query("SELECT set_config('request.jwt.claim.role', 'authenticated', true)", []);
    return await fn();
  } finally {
    await client.query('ROLLBACK');
  }
}

describe.skipIf(!connectionString)('RLS authorization', () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString });
    await client.connect();

    for (const [id, email, name] of [
      [MEMBER_ID, 'member@example.com', 'Member One'],
      [OTHER_ID, 'other@example.com', 'Member Two'],
    ]) {
      await client.query(
        'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [id, email]
      );
    }
  });

  afterAll(async () => {
    await client?.end();
  });

  describe('privilege escalation via profiles.is_internal', () => {
    it('BLOCKS a non-admin from granting themselves is_internal', async () => {
      await expect(
        asUser(MEMBER_ID, () =>
          client.query('UPDATE public.profiles SET is_internal = true WHERE id = $1', [MEMBER_ID])
        )
      ).rejects.toThrow(/row-level security/i);
    });

    it('BLOCKS escalation smuggled alongside a legitimate field update', async () => {
      await expect(
        asUser(MEMBER_ID, () =>
          client.query(
            'UPDATE public.profiles SET full_name = $2, is_internal = true WHERE id = $1',
            [MEMBER_ID, 'Escalated']
          )
        )
      ).rejects.toThrow(/row-level security/i);
    });

    it('leaves is_internal false after failed escalation attempts', async () => {
      const { rows } = await client.query(
        'SELECT is_internal FROM public.profiles WHERE id = $1',
        [MEMBER_ID]
      );
      expect(rows[0].is_internal).toBe(false);
    });

    it('ALLOWS a user to update their own non-privileged fields', async () => {
      // Also proves the profiles UPDATE policy does not hit infinite recursion:
      // its WITH CHECK subqueries public.profiles from a policy on
      // public.profiles, and only terminates because is_admin() is SECURITY
      // DEFINER owned by a BYPASSRLS role. If that ownership ever changes this
      // fails with "infinite recursion detected in policy for relation profiles".
      const result = await asUser(MEMBER_ID, () =>
        client.query('UPDATE public.profiles SET full_name = $2 WHERE id = $1', [
          MEMBER_ID,
          'Renamed Safely',
        ])
      );
      expect(result.rowCount).toBe(1);
    });
  });

  describe('cross-tenant isolation', () => {
    it("BLOCKS a user from updating another user's profile", async () => {
      const result = await asUser(MEMBER_ID, () =>
        client.query('UPDATE public.profiles SET full_name = $2 WHERE id = $1', [
          OTHER_ID,
          'Hijacked',
        ])
      );
      expect(result.rowCount).toBe(0);
    });

    it("BLOCKS a user from reading another user's profile", async () => {
      const { rows } = await asUser(MEMBER_ID, () =>
        client.query('SELECT id FROM public.profiles WHERE id = $1', [OTHER_ID])
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe('signup trust boundary (on_auth_user_created trigger)', () => {
    it('IGNORES attacker-controlled raw_user_meta_data when setting is_internal', async () => {
      // raw_user_meta_data is settable by the client at signup. If
      // handle_new_user() ever trusts it again, this is a direct path to admin.
      // This fires the REAL trigger rather than re-implementing its logic.
      await client.query(
        `INSERT INTO auth.users (id, email, raw_user_meta_data)
         VALUES ($1, $2, '{"is_internal": true, "full_name": "Attacker"}'::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [ATTACKER_ID, 'attacker@example.com']
      );

      const { rows } = await client.query(
        'SELECT is_internal, full_name FROM public.profiles WHERE id = $1',
        [ATTACKER_ID]
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].is_internal).toBe(false);
    });

    it('HONOURS server-controlled raw_app_meta_data for is_internal', async () => {
      const staffId = '44444444-4444-4444-4444-444444444444';
      await client.query(
        `INSERT INTO auth.users (id, email, raw_app_meta_data)
         VALUES ($1, $2, '{"is_internal": true}'::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [staffId, 'staff@magnusprocura.com']
      );

      const { rows } = await client.query(
        'SELECT is_internal FROM public.profiles WHERE id = $1',
        [staffId]
      );
      expect(rows[0].is_internal).toBe(true);
    });
  });


  describe('normative SQL views', () => {
    // A view without security_invoker executes as its OWNER. The migration owner
    // holds BYPASSRLS, so such a view hands every tenant's rows to any caller who
    // can select from it, even though the underlying tables have forced RLS.
    //
    // This was a real, reproduced leak: in one session the organizations table
    // returned 0 rows to this role while member_funnel and unit_econ_run returned
    // every tenant. These tests query the real views on a real database, so they
    // fail if security_invoker is ever reset — which a CREATE OR REPLACE VIEW
    // silently does.
    const VIEWS = ['member_funnel', 'programs_sla', 'cohort_card', 'partner_scorecard', 'unit_econ_run'];

    beforeAll(async () => {
      await client.query(
        `INSERT INTO public.organizations (id, name, type)
         VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Tenant A', 'member'),
                ('bbbbbbbb-0000-0000-0000-000000000002', 'Tenant B', 'member')
         ON CONFLICT (id) DO NOTHING`
      );
      for (const v of VIEWS) {
        await client.query(`GRANT SELECT ON public.${v} TO authenticated`);
      }
    });

    it.each(VIEWS)('%s returns zero rows to a user with no organization membership', async (view) => {
      const { rows } = await asUser(MEMBER_ID, () => client.query(`SELECT * FROM public.${view}`));
      expect(rows).toHaveLength(0);
    });

    it('views agree with the underlying table for the same caller', async () => {
      const [tableCount, viewCount] = await asUser(MEMBER_ID, async () => {
        const t = await client.query('SELECT COUNT(*)::int AS n FROM public.organizations');
        const v = await client.query('SELECT COUNT(*)::int AS n FROM public.member_funnel');
        return [t.rows[0].n, v.rows[0].n];
      });
      // The leak looked exactly like table=0 while view=2.
      expect(viewCount).toBe(tableCount);
    });
  });
});
