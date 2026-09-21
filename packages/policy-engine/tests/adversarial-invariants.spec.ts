import { describe, expect, it, beforeEach } from 'vitest';
import { newDb } from 'pg-mem';

import {
  PolicyEngine,
  PolicyFailClosedError,
  createDefaultPolicyEngine,
  insuranceRule,
  packetRule,
  loadAuthoritativePolicyContext,
  evaluateAndBindScoreSnapshot,
} from '../src/index.js';
import type { DbClient } from '../src/index.js';

describe('Adversarial Invariant Suite (Section 25 Hardening Doctrine)', () => {
  let db: DbClient;
  let rawClient: any;

  beforeEach(async () => {
    const mem = newDb({ autoCreateForeignKeyIndices: true });
    const adapter = mem.adapters.createPg();
    const pool = new adapter.Pool();
    rawClient = await pool.connect();

    // Create minimal schema for authoritative tables, audit log, and score snapshots
    await rawClient.query(`
      CREATE TABLE organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        type TEXT NOT NULL
      );

      CREATE TABLE packets (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE artifacts (
        id TEXT PRIMARY KEY,
        packet_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE fit_reviews (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        passed BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE audit_log (
        id TEXT PRIMARY KEY,
        actor_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        meta JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE score_snapshots (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        cohort_id TEXT NOT NULL,
        json JSONB NOT NULL,
        taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    db = {
      query: async <T = unknown>(sql: string, params?: readonly unknown[]) => {
        const result = await rawClient.query(sql, params ? [...params] : undefined);
        return { rows: result.rows as T[] };
      },
    };
  });

  it('INVARIANT 1: Missing insurance fails-closed (eliminates compliance-by-absence)', () => {
    const evaluatedAt = '2026-09-21T12:00:00.000Z';

    const result = insuranceRule.evaluate({
      entityId: 'supplier-adversarial-1',
      supplierProfile: { name: 'Apex Industrial' },
      features: {},
      credentials: {}, // Absence of insurance
      input: { evaluatedAt },
    });

    // Must be FAIL, never WARN
    expect(result.status).toBe('FAIL');
    expect(result.reasons).toContain('Missing mandatory insurance credential');
  });

  it('INVARIANT 2: Expired insurance fails-closed even 1 second past expiry', () => {
    const evaluatedAt = '2026-09-21T12:00:00.000Z';
    const expiredTimestamp = '2026-09-21T11:59:59.000Z';

    const result = insuranceRule.evaluate({
      entityId: 'supplier-adversarial-2',
      supplierProfile: { name: 'Apex Industrial' },
      features: {},
      credentials: {
        insurance: {
          policyNumber: 'POL-EXPIRED-99',
          expiresAt: expiredTimestamp,
        },
      },
      input: { evaluatedAt },
    });

    expect(result.status).toBe('FAIL');
    expect(result.reasons).toContain('Insurance is expired');
  });

  it('INVARIANT 3: Blocked or missing risk packet fails-closed', () => {
    const evaluatedAt = '2026-09-21T12:00:00.000Z';

    // A. Missing packet
    const missingPacketResult = packetRule.evaluate({
      entityId: 'supplier-adversarial-3',
      supplierProfile: {},
      features: {},
      credentials: {},
      input: { evaluatedAt },
    });
    expect(missingPacketResult.status).toBe('FAIL');
    expect(missingPacketResult.reasons[0]).toContain('Missing mandatory risk packet');

    // B. Blocked packet
    const blockedPacketResult = packetRule.evaluate({
      entityId: 'supplier-adversarial-3',
      supplierProfile: {},
      features: {},
      credentials: { packetStatus: 'blocked' },
      input: { evaluatedAt },
    });
    expect(blockedPacketResult.status).toBe('FAIL');
    expect(blockedPacketResult.reasons[0]).toContain('blocked due to compliance');
  });

  it('INVARIANT 4: Authoritative context loader extracts ground truth from database and enforces fail-closed on unverified suppliers', async () => {
    const orgId = 'org-unverified-1';
    await db.query(
      `INSERT INTO organizations (id, name, status, type) VALUES ($1, 'Unverified Corp', 'active', 'supplier')`,
      [orgId]
    );

    // Supplier has no packet and no insurance in the database
    const context = await loadAuthoritativePolicyContext(db, orgId);

    expect(context.entityId).toBe(orgId);
    expect(context.credentials.insurance).toBeNull();
    expect(context.credentials.packetStatus).toBeNull();

    const engine = createDefaultPolicyEngine();
    const report = await engine.evaluate(context);

    // Evaluating authoritative state must produce FAIL
    expect(report.overallStatus).toBe('FAIL');
    expect(report.violations.length).toBeGreaterThanOrEqual(1);
  });

  it('INVARIANT 5: Scoring evidence chain blocks score snapshot generation and logs audit on policy failure', async () => {
    const orgId = 'org-failing-1';
    const cohortId = 'cohort-2026-q3';

    await db.query(
      `INSERT INTO organizations (id, name, status, type) VALUES ($1, 'Failing Corp', 'active', 'supplier')`,
      [orgId]
    );

    const context = await loadAuthoritativePolicyContext(db, orgId);
    const engine = createDefaultPolicyEngine();

    // Must throw PolicyFailClosedError
    await expect(
      evaluateAndBindScoreSnapshot({
        orgId,
        cohortId,
        context,
        engine,
        db,
      })
    ).rejects.toThrowError(PolicyFailClosedError);

    // Audit log must have recorded policy.evaluation.failed
    const auditRows = await db.query<{ action: string; meta: any }>(
      `SELECT action, meta FROM audit_log WHERE entity_id = $1`,
      [orgId]
    );
    expect(auditRows.rows.length).toBe(1);
    expect(auditRows.rows[0].action).toBe('policy.evaluation.failed');

    // Score snapshots table must have ZERO records (scoring blocked!)
    const snapshotRows = await db.query(
      `SELECT id FROM score_snapshots WHERE org_id = $1`,
      [orgId]
    );
    expect(snapshotRows.rows.length).toBe(0);
  });

  it('INVARIANT 6: Scoring evidence chain binds snapshot to immutable policyBatchId when verified', async () => {
    const orgId = 'org-verified-1';
    const cohortId = 'cohort-2026-q3';
    const packetId = 'packet-verified-1';

    // Populate verified supplier with active COI insurance and ready packet
    await db.query(
      `INSERT INTO organizations (id, name, status, type) VALUES ($1, 'Apex Verified Robotics', 'active', 'supplier')`,
      [orgId]
    );
    await db.query(
      `INSERT INTO packets (id, org_id, status) VALUES ($1, $2, 'ready')`,
      [packetId, orgId]
    );
    await db.query(
      `INSERT INTO artifacts (id, packet_id, kind, storage_path) VALUES ('art_coi', $1, 'coi_insurance', 'packets/coi.pdf')`,
      [packetId]
    );
    await db.query(
      `INSERT INTO artifacts (id, packet_id, kind, storage_path) VALUES ('art_cap', $1, 'capability_statement', 'packets/cap.pdf')`,
      [packetId]
    );
    await db.query(
      `INSERT INTO fit_reviews (id, org_id, score, passed) VALUES ('fit_1', $1, 98, true)`,
      [orgId]
    );

    const context = await loadAuthoritativePolicyContext(db, orgId);
    // Add dummy certifications to satisfy default certifications rule
    const fullContext = {
      ...context,
      credentials: {
        ...context.credentials,
        certifications: ['ISO-9001', 'AS9100D'],
      },
    };

    const engine = createDefaultPolicyEngine();
    const result = await evaluateAndBindScoreSnapshot({
      orgId,
      cohortId,
      context: fullContext,
      engine,
      db,
    });

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.policyBatchId).toBeDefined();

    // Verify audit log has matching policyBatchId
    const auditResult = await db.query<{ action: string; meta: any }>(
      `SELECT action, meta FROM audit_log WHERE entity_id = $1 AND action = 'policy.evaluation.completed'`,
      [orgId]
    );
    expect(auditResult.rows.length).toBe(1);
    expect(auditResult.rows[0].meta.policyBatchId).toBe(result.policyBatchId);

    // Verify score_snapshots has matching linked policyBatchId
    const snapshotResult = await db.query<{ json: any }>(
      `SELECT json FROM score_snapshots WHERE id = $1`,
      [result.scoreSnapshotId]
    );
    expect(snapshotResult.rows.length).toBe(1);
    expect(snapshotResult.rows[0].json.policyBatchId).toBe(result.policyBatchId);
    expect(snapshotResult.rows[0].json.policyStatus).toBe('PASS');
  });

  it('INVARIANT 7: Duplicate policy evaluation batch is rejected idempotently', async () => {
    const orgId = 'org-dup-check';
    const policyBatchId = 'batch-already-processed';

    await db.query(
      `INSERT INTO audit_log (id, action, entity_type, entity_id, meta)
       VALUES ('aud_1', 'policy.evaluation.completed', 'organization', $1, $2)`,
      [orgId, JSON.stringify({ policyBatchId })]
    );

    // Re-evaluating with the same batch ID must reject
    const engine = createDefaultPolicyEngine();
    await expect(
      evaluateAndBindScoreSnapshot({
        orgId,
        cohortId: 'c1',
        context: {
          entityId: orgId,
          supplierProfile: {},
          features: {},
          credentials: {},
          input: { evaluatedAt: new Date().toISOString() },
        },
        engine,
        db,
        policyBatchId,
      })
    ).rejects.toThrowError(/Duplicate evaluation batch/);
  });

  it('INVARIANT 8: Evaluates packet statuses correctly across ready and review phases', () => {
    const readyResult = packetRule.evaluate({
      entityId: 'sup-ready',
      supplierProfile: {},
      features: {},
      credentials: { packetStatus: 'ready' },
      input: {},
    });
    expect(readyResult.status).toBe('PASS');

    const reviewResult = packetRule.evaluate({
      entityId: 'sup-review',
      supplierProfile: {},
      features: {},
      credentials: { packetStatus: 'in_review' },
      input: {},
    });
    expect(reviewResult.status).toBe('WARN');
    expect(reviewResult.reasons[0]).toContain("Risk packet is currently in 'in_review' status");
  });

  it('INVARIANT 9: loadAuthoritativePolicyContext throws if organization does not exist', async () => {
    await expect(
      loadAuthoritativePolicyContext(db, 'nonexistent-org-id')
    ).rejects.toThrowError("Organization 'nonexistent-org-id' not found");
  });
});
