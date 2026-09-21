import { readFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';

import { buildEvent, enqueueScoringJob, processNextScoringJob } from '../src/index.ts';
import type { DbClient, Logger } from '../src/types.ts';

const splitSqlStatements = (sql: string): string[] => {
  return sql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => `${stmt};`);
};

const createTestDb = async (): Promise<{
  db: DbClient;
  raw: { query: (sql: string, params?: unknown[]) => Promise<any> };
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
      const result = await client.query(sql, params as unknown[] | undefined);
      return { rows: result.rows as T[] };
    }
  };

  return { db, raw: client, close: () => client.release() };
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

describe('scoring-engine', () => {
  let db: DbClient;
  let raw: { query: (sql: string, params?: unknown[]) => Promise<any> };
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

  it('suppresses duplicate events via idempotency key', async () => {
    const event = buildEvent({
      entityId: 'supplier-1',
      eventType: 'SUPPLIER_PROFILE_UPDATED',
      payload: { legalName: 'Acme Co', industry: 'manufacturing' },
      triggeredBy: { username: 'admin', role: 'ADMIN' }
    });

    const first = await enqueueScoringJob(db, event);
    expect(first.created).toBe(true);

    const second = await enqueueScoringJob(db, event);
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);

    const count = await raw.query('SELECT COUNT(*)::int AS c FROM scoring_jobs');
    expect(count.rows[0].c).toBe(1);
  });

  it('processes a queued job and persists score + explanation + audit atomically', async () => {
    const event = buildEvent({
      entityId: 'supplier-2',
      eventType: 'DOCUMENT_UPLOADED',
      payload: {
        documentType: 'w9',
        insurance: { expiresAt: '2027-01-01T00:00:00.000Z', policyNumber: 'POL-12345' },
        certifications: ['ISO-9001']
      },
      triggeredBy: { username: 'admin', role: 'ADMIN' }
    });

    const { job } = await enqueueScoringJob(db, event);

    const { logger } = createTestLogger();
    const result = await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 10, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'disabled' }
    });

    expect(result.processed).toBe(true);
    expect(result.jobId).toBe(job.id);

    const jobs = await raw.query("SELECT status FROM scoring_jobs WHERE id = $1", [job.id]);
    expect(jobs.rows[0].status).toBe('completed');

    const scores = await raw.query('SELECT id, score FROM scoring_scores');
    expect(scores.rows).toHaveLength(1);
    expect(scores.rows[0].score).toBeTypeOf('number');

    const explanations = await raw.query('SELECT score_id FROM scoring_explanations');
    expect(explanations.rows).toHaveLength(1);
    expect(String(explanations.rows[0].score_id)).toBe(String(scores.rows[0].id));

    const audits = await raw.query('SELECT action FROM scoring_audit');
    expect(audits.rows).toHaveLength(1);
    expect(audits.rows[0].action).toBe('SCORE_PERSISTED');
  });

  it('retries on failure and completes successfully on a subsequent attempt', async () => {
    const event = buildEvent({
      entityId: 'supplier-3',
      eventType: 'EXTERNAL_SYNC_UPDATED',
      payload: {
        source: 'crm',
        insurance: { expiresAt: '2027-01-01T00:00:00.000Z', policyNumber: 'POL-67890' },
        certifications: ['ISO-9001']
      },
      triggeredBy: { username: 'admin', role: 'ADMIN' }
    });

    const { job } = await enqueueScoringJob(db, event);
    const { logger } = createTestLogger();

    await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'required' }
    });

    const failed = await raw.query('SELECT status, attempt_count, last_error FROM scoring_jobs WHERE id = $1', [job.id]);
    expect(failed.rows[0].status).toBe('failed');
    expect(failed.rows[0].attempt_count).toBe(1);
    expect(String(failed.rows[0].last_error)).toMatch(/ML scoring is required/i);

    await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'disabled' }
    });

    const completed = await raw.query('SELECT status, attempt_count FROM scoring_jobs WHERE id = $1', [job.id]);
    expect(completed.rows[0].status).toBe('completed');
    expect(completed.rows[0].attempt_count).toBe(1);

    const scores = await raw.query('SELECT COUNT(*)::int AS c FROM scoring_scores');
    const explanations = await raw.query('SELECT COUNT(*)::int AS c FROM scoring_explanations');
    const audits = await raw.query('SELECT COUNT(*)::int AS c FROM scoring_audit');
    expect(scores.rows[0].c).toBe(1);
    expect(explanations.rows[0].c).toBe(1);
    expect(audits.rows[0].c).toBe(1);
  });

  it('dead-letters after max attempts and stops reprocessing', async () => {
    const event = buildEvent({
      entityId: 'supplier-4',
      eventType: 'CREDENTIAL_EXPIRED',
      payload: { credentialType: 'insurance' },
      triggeredBy: { username: 'admin', role: 'ADMIN' }
    });

    const { job } = await enqueueScoringJob(db, event);
    const { logger } = createTestLogger();

    await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'required' }
    });

    await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'required' }
    });

    const dead = await raw.query('SELECT status, attempt_count FROM scoring_jobs WHERE id = $1', [job.id]);
    expect(dead.rows[0].status).toBe('dead');
    expect(dead.rows[0].attempt_count).toBe(2);

    const third = await processNextScoringJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0, mlMode: 'required' }
    });
    expect(third.processed).toBe(false);
  });
});
