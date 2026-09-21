import { readFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';

import {
  PolicyEngine,
  PolicyFailClosedError,
  PolicyRuleRegistry,
  certificationsRule,
  createDefaultPolicyEngine,
  evaluateRules,
  insuranceRule,
  readinessRule
} from '../src/index.ts';
import type { DbClient, Logger, PolicyRule } from '../src/index.ts';

const splitSqlStatements = (sql: string): string[] => {
  return sql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => `${stmt};`);
};

const createTestDb = async (): Promise<{
  db: DbClient;
  raw: { query: (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[] }> };
  close: () => void;
}> => {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();
  const client = await pool.connect();

  const schemaPath = new URL('../sql/schema.sql', import.meta.url);
  const schema = await readFile(schemaPath, 'utf8');
  for (const stmt of splitSqlStatements(schema)) {
    await client.query(stmt);
  }

  const db: DbClient = {
    query: async <T = unknown>(sql: string, params?: readonly unknown[]) => {
      const result = await client.query(sql, params ? [...params] : undefined);
      return { rows: result.rows as T[] };
    }
  };

  return {
    db,
    raw: {
      query: async (sql: string, params?: readonly unknown[]) => {
        const result = await client.query(sql, params ? [...params] : undefined);
        return { rows: result.rows as unknown[] };
      }
    },
    close: () => client.release()
  };
};

const createTestLogger = (): { logger: Logger; events: Array<{ level: string; msg: string; obj: Record<string, unknown> }> } => {
  const events: Array<{ level: string; msg: string; obj: Record<string, unknown> }> = [];
  const push = (level: string) => (obj: Record<string, unknown>, msg?: string) => {
    events.push({ level, msg: msg ?? '', obj });
  };
  return {
    events,
    logger: {
      info: push('info'),
      warn: push('warn'),
      error: push('error')
    }
  };
};

describe('policy-engine rules', () => {
  it('insurance rule fails for expired insurance and fails-closed when missing', () => {
    const evaluatedAt = '2025-01-01T00:00:00.000Z';

    const missing = insuranceRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: {},
      input: { evaluatedAt }
    });
    expect(missing.status).toBe('FAIL');
    expect(missing.reasons[0]).toContain('Missing mandatory insurance credential');

    const expired = insuranceRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { insurance: { expiresAt: '2020-01-01T00:00:00.000Z', policyNumber: 'P' } },
      input: { evaluatedAt }
    });
    expect(expired.status).toBe('FAIL');
  });

  it('insurance rule fails on invalid shape, fails on invalid date, and passes when active', () => {
    const evaluatedAt = '2025-01-01T00:00:00.000Z';

    const badShape = insuranceRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { insurance: { expiresAt: '2026-01-01T00:00:00.000Z' } },
      input: { evaluatedAt }
    });
    expect(badShape.status).toBe('FAIL');

    const badDate = insuranceRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { insurance: { expiresAt: 'not-a-date', policyNumber: 'P' } },
      input: { evaluatedAt }
    });
    expect(badDate.status).toBe('FAIL');

    const ok = insuranceRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { insurance: { expiresAt: '2026-01-01T00:00:00.000Z', policyNumber: 'P' } },
      input: { evaluatedAt }
    });
    expect(ok.status).toBe('PASS');
  });

  it('certifications rule passes with non-empty list and fails on invalid shape', () => {
    const evaluatedAt = '2025-01-01T00:00:00.000Z';

    const ok = certificationsRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { certifications: ['ISO9001'] },
      input: { evaluatedAt }
    });
    expect(ok.status).toBe('PASS');

    const bad = certificationsRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { certifications: 1 },
      input: { evaluatedAt }
    });
    expect(bad.status).toBe('FAIL');
  });

  it('certifications rule warns on empty list and warns when missing', () => {
    const evaluatedAt = '2025-01-01T00:00:00.000Z';

    const missing = certificationsRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: {},
      input: { evaluatedAt }
    });
    expect(missing.status).toBe('WARN');

    const empty = certificationsRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: {},
      credentials: { certifications: [] },
      input: { evaluatedAt }
    });
    expect(empty.status).toBe('WARN');
  });

  it('readiness rule warns below threshold and fails on invalid input', () => {
    const evaluatedAt = '2025-01-01T00:00:00.000Z';

    const warn = readinessRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: { readinessScore: 10 },
      credentials: {},
      input: { evaluatedAt }
    });
    expect(warn.status).toBe('WARN');

    const bad = readinessRule.evaluate({
      entityId: 'e',
      supplierProfile: {},
      features: { readinessScore: 'x' },
      credentials: {},
      input: { evaluatedAt }
    });
    expect(bad.status).toBe('FAIL');
  });
});

describe('policy-engine engine', () => {
  let db: DbClient;
  let raw: { query: (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[] }> };
  let close: () => void;

  beforeEach(async () => {
    const setup = await createTestDb();
    db = setup.db;
    raw = setup.raw;
    close = setup.close;
  });

  afterEach(() => {
    close();
  });

  it('aggregates results deterministically and persists per-rule audit rows', async () => {
    const { logger } = createTestLogger();
    const engine = new PolicyEngine({ now: () => new Date('2025-01-01T00:00:00.000Z') });
    engine.registerDefaults();

    const report = await engine.evaluateAndPersist({
      db,
      logger,
      context: {
        entityId: 'supplier-1',
        supplierProfile: { legalName: 'Acme' },
        features: { readinessScore: 95 },
        credentials: { certifications: ['ISO9001'] }
      }
    });

    expect(report.entityId).toBe('supplier-1');
    expect(report.evaluatedAt).toBe('2025-01-01T00:00:00.000Z');
    expect(report.overallStatus).toBe('FAIL'); // insurance missing => FAIL
    expect(report.explainability).toEqual({ passCount: 2, warnCount: 0, failCount: 1 });

    const rows = await raw.query('SELECT COUNT(*)::int AS c FROM policy_evaluations');
    expect((rows.rows[0] as { c: number }).c).toBe(3);

    expect(report).toMatchInlineSnapshot(`
      {
        "entityId": "supplier-1",
        "evaluatedAt": "2025-01-01T00:00:00.000Z",
        "explainability": {
          "failCount": 1,
          "passCount": 2,
          "warnCount": 0,
        },
        "overallStatus": "FAIL",
        "results": [
          {
            "description": "Supplier insurance must be active (not expired) and affirmatively verified.",
            "result": {
              "metadata": {
                "checked": true,
                "missing": true,
              },
              "reasons": [
                "Missing mandatory insurance credential",
              ],
              "status": "FAIL",
              "timestamp": "2025-01-01T00:00:00.000Z",
            },
            "ruleId": "insurance.active",
          },
          {
            "description": "Certifications should be present when provided.",
            "result": {
              "metadata": {
                "count": 1,
              },
              "reasons": [],
              "status": "PASS",
              "timestamp": "2025-01-01T00:00:00.000Z",
            },
            "ruleId": "certifications.present",
          },
          {
            "description": "Readiness score must be >= 90 when provided.",
            "result": {
              "metadata": {
                "readinessScore": 95,
                "threshold": 90,
              },
              "reasons": [],
              "status": "PASS",
              "timestamp": "2025-01-01T00:00:00.000Z",
            },
            "ruleId": "readiness.minimum",
          },
        ],
        "violations": [
          {
            "reasons": [
              "Missing mandatory insurance credential",
            ],
            "ruleId": "insurance.active",
            "status": "FAIL",
          },
        ],
      }
    `);
  });

  it('aggregates to PASS when all rules pass', () => {
    const clock = { now: () => new Date('2025-01-01T00:00:00.000Z') };
    const evaluatedAt = clock.now().toISOString();
    const engine = createDefaultPolicyEngine(clock);
    const report = evaluateRules({
      rules: engine.listRules(),
      clock,
      context: {
        entityId: 'supplier-pass',
        supplierProfile: {},
        features: { readinessScore: 95 },
        credentials: {
          certifications: ['ISO9001'],
          insurance: { expiresAt: '2026-01-01T00:00:00.000Z', policyNumber: 'P' }
        },
        input: { evaluatedAt }
      }
    });

    expect(report.overallStatus).toBe('PASS');
    expect(report.violations).toEqual([]);
    expect(report.explainability).toEqual({ passCount: 3, warnCount: 0, failCount: 0 });
  });

  it('covers evaluator aggregation for FAIL and mixed statuses', () => {
    const clock = { now: () => new Date('2025-01-01T00:00:00.000Z') };
    const evaluatedAt = clock.now().toISOString();

    const rules: PolicyRule[] = [
      {
        id: 'r.pass',
        description: 'pass',
        evaluate: () => ({ status: 'PASS', reasons: [], metadata: {}, timestamp: evaluatedAt })
      },
      {
        id: 'r.warn',
        description: 'warn',
        evaluate: () => ({ status: 'WARN', reasons: ['w'], metadata: {}, timestamp: evaluatedAt })
      },
      {
        id: 'r.fail',
        description: 'fail',
        evaluate: () => ({ status: 'FAIL', reasons: ['f'], metadata: {}, timestamp: evaluatedAt })
      }
    ];

    const report = evaluateRules({
      rules,
      clock,
      context: { entityId: 'e', supplierProfile: {}, features: {}, credentials: {}, input: { evaluatedAt } }
    });

    expect(report.overallStatus).toBe('FAIL');
    expect(report.explainability).toEqual({ passCount: 1, warnCount: 1, failCount: 1 });
    expect(report.violations).toHaveLength(2);
  });

  it('fails closed if a rule throws and records engine audit entry', async () => {
    const { logger } = createTestLogger();
    const engine = new PolicyEngine({ now: () => new Date('2025-01-01T00:00:00.000Z') });

    const throwingRule: PolicyRule = {
      id: 'throwing.rule',
      description: 'throws',
      evaluate: () => {
        throw new Error('boom');
      }
    };
    engine.registerRule(throwingRule);

    await expect(
      engine.evaluateAndPersist({
        db,
        logger,
        context: {
          entityId: 'supplier-2',
          supplierProfile: {},
          features: {},
          credentials: {}
        }
      })
    ).rejects.toBeInstanceOf(PolicyFailClosedError);

    const rows = await raw.query("SELECT rule_id, result FROM policy_evaluations WHERE entity_id = 'supplier-2'");
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toEqual({ rule_id: 'ENGINE_FAIL_CLOSED', result: 'FAIL' });
  });

  it('covers registry validation', () => {
    const r = new PolicyRuleRegistry();
    expect(() => r.register({ id: 'x', description: 'd', evaluate: () => ({ status: 'PASS', reasons: [], metadata: {}, timestamp: 't' }) })).not.toThrow();
    expect(() => r.register({ id: 'x', description: 'd', evaluate: () => ({ status: 'PASS', reasons: [], metadata: {}, timestamp: 't' }) })).toThrow();
    expect(() => r.register({ id: '   ', description: 'd', evaluate: () => ({ status: 'PASS', reasons: [], metadata: {}, timestamp: 't' }) })).toThrow();
    expect(() => r.register({ id: 'y', description: '   ', evaluate: () => ({ status: 'PASS', reasons: [], metadata: {}, timestamp: 't' }) })).toThrow();
  });

  it('covers audit persistence error path (audit write fails)', async () => {
    const { logger } = createTestLogger();

    const failingDb: DbClient = {
      query: async (sql: string, params?: readonly unknown[]) => {
        if (/INSERT INTO policy_evaluations/i.test(sql)) {
          throw new Error('no table');
        }
        return db.query(sql, params);
      }
    };

    const engine = new PolicyEngine({ now: () => new Date('2025-01-01T00:00:00.000Z') });
    engine.registerDefaults();

    await expect(
      engine.evaluateAndPersist({
        db: failingDb,
        logger,
        context: {
          entityId: 'supplier-3',
          supplierProfile: {},
          features: {},
          credentials: {}
        }
      })
    ).rejects.toBeInstanceOf(PolicyFailClosedError);
  });

  it('covers fail-closed when error is non-Error and audit persistence error is non-Error', async () => {
    const { logger } = createTestLogger();

    const throwingRule: PolicyRule = {
      id: 'throw.string',
      description: 'throws string',
      evaluate: () => {
        throw 'boom';
      }
    };

    const dbThrowsStringOnInsert: DbClient = {
      query: async (sql: string, params?: readonly unknown[]) => {
        if (/INSERT INTO policy_evaluations/i.test(sql)) {
          throw 'db-boom';
        }
        return db.query(sql, params);
      }
    };

    const engine = new PolicyEngine({ now: () => new Date('2025-01-01T00:00:00.000Z') });
    engine.registerRule(throwingRule);

    await expect(
      engine.evaluateAndPersist({
        db: dbThrowsStringOnInsert,
        logger,
        context: {
          entityId: 'supplier-4',
          supplierProfile: {},
          features: {},
          credentials: {}
        }
      })
    ).rejects.toBeInstanceOf(PolicyFailClosedError);
  });

  it('covers default clock constructor', async () => {
    const { logger } = createTestLogger();
    const engine = new PolicyEngine();
    engine.registerDefaults();

    const report = await engine.evaluateAndPersist({
      db,
      logger,
      context: {
        entityId: 'supplier-default-clock',
        supplierProfile: {},
        features: {},
        credentials: {}
      }
    });

    expect(report.entityId).toBe('supplier-default-clock');
  });
});
