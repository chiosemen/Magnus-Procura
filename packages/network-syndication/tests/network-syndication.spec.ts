import { readFile } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';

import type { Connector, DbClient, Logger } from '../src/index.ts';
import {
  IdempotencyConflictError,
  computeBackoffMs,
  createIdempotencyKey,
  emitSyncRequested,
  createPayloadHash,
  processNextSyndicationJob,
  startSyndicationWorker,
  buildSyncRequestedEvent,
  enqueueSyndicationJob,
  markJobCompleted,
  markJobFailed
} from '../src/index.ts';
import { aribaConnector } from '../src/connectors/ariba.js';
import { coupaConnector } from '../src/connectors/coupa.js';
import { jaggaerConnector } from '../src/connectors/jaggaer.js';
import { runInTransaction } from '../src/worker.js';

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

describe('network-syndication', () => {
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

  it('suppresses duplicate enqueue via idempotency key (single job row)', async () => {
    const { logger } = createTestLogger();

    const first = await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-1',
      network: 'ariba',
      payload: { supplierId: 'supplier-1', action: 'SYNC' },
      requestedBy: { username: 'admin', role: 'ADMIN' }
    });
    expect(first.created).toBe(true);

    const second = await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-1',
      network: 'ariba',
      payload: { supplierId: 'supplier-1', action: 'SYNC' },
      requestedBy: { username: 'admin', role: 'ADMIN' }
    });
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);

    const count = await raw.query('SELECT COUNT(*)::int AS c FROM syndication_jobs');
    expect((count.rows[0] as { c: number }).c).toBe(1);

    const audit = await raw.query('SELECT COUNT(*)::int AS c FROM syndication_audit');
    expect((audit.rows[0] as { c: number }).c).toBe(1);
  });

  it('fails closed on idempotency conflict (same idempotency_key, different payload_hash)', async () => {
    const { logger } = createTestLogger();

    const payload = { a: 2 };
    const computedKey = createIdempotencyKey('ariba', 'supplier-1', payload);
    const computedHash = createPayloadHash(payload);

    await raw.query(
      `INSERT INTO syndication_jobs (supplier_id, network, payload, payload_hash, idempotency_key, status, attempt_count, last_error, created_at, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,'queued',0,NULL,NOW(),NOW())`,
      ['supplier-1', 'ariba', JSON.stringify(payload), `${computedHash.slice(0, 6)}deadbeef`, computedKey]
    );

    await expect(
      emitSyncRequested({
        db,
        logger,
        supplierId: 'supplier-1',
        network: 'ariba',
        payload,
        requestedBy: { username: 'admin', role: 'ADMIN' }
      })
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it('processes a queued job with a mock connector and persists success + audit', async () => {
    const { logger, events } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-2',
      network: 'coupa',
      payload: { supplierId: 'supplier-2', action: 'SYNC', value: 1 }
    });

    const connectorCalls: unknown[] = [];
    const mockConnector: Connector = {
      name: 'coupa',
      send: async (payload) => {
        connectorCalls.push(payload);
        return { ok: true, details: { received: true } };
      },
      healthCheck: async () => true
    };

    const result = await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { coupa: mockConnector }
    });
    expect(result.processed).toBe(true);

    const jobs = await raw.query("SELECT status FROM syndication_jobs WHERE supplier_id = 'supplier-2'");
    expect((jobs.rows[0] as { status: string }).status).toBe('completed');
    expect(connectorCalls).toHaveLength(1);

    const audits = await raw.query('SELECT action FROM syndication_audit ORDER BY id ASC');
    const actions = audits.rows.map((r) => (r as { action: string }).action);
    expect(actions).toContain('SYNDICATION_ENQUEUED');
    expect(actions).toContain('SYNDICATION_ATTEMPT');
    expect(actions).toContain('SYNDICATION_SUCCESS');

    const messages = events.map((e) => e.msg);
    expect(messages).toContain('syndication_enqueued');
    expect(messages).toContain('syndication_attempt');
    expect(messages).toContain('syndication_success');
  });

  it('retries safely on failure then completes on a subsequent attempt', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-3',
      network: 'ariba',
      payload: { supplierId: 'supplier-3', action: 'SYNC', n: 1 }
    });

    let callCount = 0;
    const flaky: Connector = {
      name: 'ariba',
      send: async () => {
        callCount += 1;
        if (callCount === 1) {
          throw new Error('temporary');
        }
        return { ok: true, externalId: 'ok' };
      },
      healthCheck: async () => true
    };

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { ariba: flaky }
    });

    const failed = await raw.query("SELECT status, attempt_count FROM syndication_jobs WHERE supplier_id = 'supplier-3'");
    expect((failed.rows[0] as { status: string }).status).toBe('failed');
    expect((failed.rows[0] as { attempt_count: number }).attempt_count).toBe(1);

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { ariba: flaky }
    });

    const completed = await raw.query("SELECT status, attempt_count FROM syndication_jobs WHERE supplier_id = 'supplier-3'");
    expect((completed.rows[0] as { status: string }).status).toBe('completed');
    expect((completed.rows[0] as { attempt_count: number }).attempt_count).toBe(1);
  });

  it('transitions to dead letter after max attempts and stops reprocessing', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-4',
      network: 'jaggaer',
      payload: { supplierId: 'supplier-4', action: 'SYNC' }
    });

    const alwaysFail: Connector = {
      name: 'jaggaer',
      send: async () => {
        throw new Error('hard-fail');
      },
      healthCheck: async () => true
    };

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { jaggaer: alwaysFail }
    });
    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { jaggaer: alwaysFail }
    });

    const dead = await raw.query("SELECT status, attempt_count FROM syndication_jobs WHERE supplier_id = 'supplier-4'");
    expect((dead.rows[0] as { status: string }).status).toBe('dead');
    expect((dead.rows[0] as { attempt_count: number }).attempt_count).toBe(2);

    const third = await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { jaggaer: alwaysFail }
    });
    expect(third.processed).toBe(false);

    const audits = await raw.query('SELECT action FROM syndication_audit ORDER BY id ASC');
    const actions = audits.rows.map((r) => (r as { action: string }).action);
    expect(actions).toContain('SYNDICATION_DEAD_LETTER');
  });

  it('enforces exponential backoff gating for failed jobs', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-5',
      network: 'ariba',
      payload: { supplierId: 'supplier-5', action: 'SYNC' }
    });

    const failOnce: Connector = {
      name: 'ariba',
      send: async () => {
        throw new Error('fail');
      },
      healthCheck: async () => true
    };

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 1000, pollIntervalMs: 0 },
      connectors: { ariba: failOnce }
    });

    const immediate = await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 1000, pollIntervalMs: 0 },
      connectors: { ariba: failOnce }
    });
    expect(immediate.processed).toBe(false);

    await raw.query("UPDATE syndication_jobs SET available_at = NOW() - interval '2 seconds' WHERE supplier_id = 'supplier-5'");

    const eligible = await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 1000, pollIntervalMs: 0 },
      connectors: { ariba: failOnce }
    });
    expect(eligible.processed).toBe(true);
  });

  it('fails closed when connector is missing for network', async () => {
    const { logger } = createTestLogger();

    await raw.query(
      `INSERT INTO syndication_jobs (supplier_id, network, payload, payload_hash, idempotency_key, status, attempt_count, last_error, created_at, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,'queued',0,NULL,NOW(),NOW())`,
      ['supplier-6', 'unknown', JSON.stringify({ supplierId: 'supplier-6' }), 'h', 'k']
    );

    await expect(
      processNextSyndicationJob({
        db,
        logger,
        config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0 }
      })
    ).resolves.toEqual(expect.objectContaining({ processed: true }));

    const job = await raw.query("SELECT status, last_error FROM syndication_jobs WHERE supplier_id = 'supplier-6'");
    expect((job.rows[0] as { status: string }).status).toBe('failed');
    expect((job.rows[0] as { last_error: string }).last_error).toMatch(/connector not found/i);
  });

  it('covers connector stubs and retry utilities', async () => {
    expect(await aribaConnector.healthCheck()).toBe(false);
    expect(await coupaConnector.healthCheck()).toBe(false);
    expect(await jaggaerConnector.healthCheck()).toBe(false);

    expect(await aribaConnector.send({})).toEqual({ ok: false, error: 'UNCONFIGURED_CONNECTOR' });
    expect(await coupaConnector.send({})).toEqual({ ok: false, error: 'UNCONFIGURED_CONNECTOR' });
    expect(await jaggaerConnector.send({})).toEqual({ ok: false, error: 'UNCONFIGURED_CONNECTOR' });

    expect(computeBackoffMs(1000, 1)).toBe(1000);
    expect(computeBackoffMs(1000, 2)).toBe(2000);
    expect(computeBackoffMs(1000, 10)).toBe(60000);
    expect(computeBackoffMs(-1, 1)).toBe(0);
  });

  it('covers event builder and idempotency hashing branches', () => {
    const ev1 = buildSyncRequestedEvent({ supplierId: 's', network: 'ariba', payload: { a: 1 } });
    expect(ev1.eventType).toBe('SYNC_REQUESTED');
    expect('requestedBy' in ev1).toBe(false);

    const ev2 = buildSyncRequestedEvent({
      supplierId: 's',
      network: 'ariba',
      payload: { a: 1 },
      requestedBy: { username: 'u', role: 'ADMIN' }
    });
    expect(ev2.requestedBy?.username).toBe('u');

    expect(createPayloadHash(null)).toBeTypeOf('string');
    expect(createPayloadHash('x')).toBeTypeOf('string');
    expect(createPayloadHash(1)).toBeTypeOf('string');
    expect(createPayloadHash(false)).toBeTypeOf('string');
    expect(createPayloadHash({ n: Number.POSITIVE_INFINITY })).toBeTypeOf('string');
    expect(createPayloadHash({ ok: true, list: [1, 2] })).toBeTypeOf('string');
    expect(createPayloadHash(Object.create(null) as Record<string, unknown>)).toBeTypeOf('string');
    expect(createPayloadHash(new Date('2025-01-01T00:00:00.000Z'))).toBeTypeOf('string');
    expect(createPayloadHash(undefined)).toBeTypeOf('string');
    expect(createPayloadHash(() => undefined)).toBeTypeOf('string');
    expect(createPayloadHash(Symbol('x'))).toBeTypeOf('string');
  });

  it('covers markJobCompleted/markJobFailed missing-row errors', async () => {
    await expect(markJobCompleted(db, '9999')).rejects.toBeInstanceOf(Error);
    await expect(
      markJobFailed(db, {
        jobId: '9999',
        errorMessage: 'x',
        attemptCount: 0,
        maxAttempts: 2,
        retryBaseMs: 0
      })
    ).rejects.toBeInstanceOf(Error);
  });

  it('covers worker rollback path and connector ok=false path', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-8',
      network: 'ariba',
      payload: { supplierId: 'supplier-8', action: 'SYNC' }
    });

    const okFalse: Connector = {
      name: 'ariba',
      send: async () => ({ ok: false, error: 'connector_failed' }),
      healthCheck: async () => true
    };

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { ariba: okFalse }
    });

    const job2 = await raw.query("SELECT status, attempt_count FROM syndication_jobs WHERE supplier_id = 'supplier-8'");
    expect((job2.rows[0] as { status: string }).status).toBe('failed');

    const calls: string[] = [];
    const fakeDb: DbClient = {
      query: async (sql: string) => {
        calls.push(sql);
        return { rows: [] };
      }
    };

    await expect(
      runInTransaction(fakeDb, async () => {
        throw new Error('boom');
      })
    ).rejects.toBeInstanceOf(Error);
    expect(calls).toEqual(['BEGIN', 'ROLLBACK']);
  });

  it('covers startSyndicationWorker stop controls', async () => {
    const { logger } = createTestLogger();

    await startSyndicationWorker({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      maxIterations: 1,
      sleep: async () => undefined
    });

    await startSyndicationWorker({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      shouldStop: () => true,
      sleep: async () => undefined
    });

    await startSyndicationWorker({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      maxIterations: 1
    });
  });

  it('covers idempotency race reconciliation branch', async () => {
    const payload = { supplierId: 's', action: 'SYNC' };
    const payloadHash = createPayloadHash(payload);
    const idempotencyKey = createIdempotencyKey('ariba', 's', payload);

    const existingRow = {
      id: '1',
      supplier_id: 's',
      network: 'ariba',
      payload,
      payload_hash: payloadHash,
      idempotency_key: idempotencyKey,
      status: 'queued',
      attempt_count: 0,
      last_error: null,
      available_at: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      created_at: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date('2025-01-01T00:00:00.000Z').toISOString()
    };

    let step = 0;
    const fakeDb: DbClient = {
      query: async <T = unknown>(sql: string): Promise<{ rows: T[] }> => {
        if (/^SELECT/i.test(sql) && step === 0) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^INSERT/i.test(sql) && step === 1) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^SELECT/i.test(sql) && step === 2) {
          step += 1;
          return { rows: [existingRow] as unknown as T[] };
        }
        throw new Error('unexpected query');
      }
    };

    const out = await enqueueSyndicationJob(fakeDb, {
      supplierId: 's',
      network: 'ariba',
      eventType: 'SYNC_REQUESTED',
      payload
    });
    expect(out.created).toBe(false);
  });

  it('covers idempotency conflict but missing row fail-closed', async () => {
    const payload = { supplierId: 's', action: 'SYNC' };

    let step = 0;
    const fakeDb: DbClient = {
      query: async <T = unknown>(sql: string): Promise<{ rows: T[] }> => {
        if (/^SELECT/i.test(sql) && step === 0) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^INSERT/i.test(sql) && step === 1) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^SELECT/i.test(sql) && step === 2) {
          step += 1;
          return { rows: [] as T[] };
        }
        throw new Error('unexpected query');
      }
    };

    await expect(
      enqueueSyndicationJob(fakeDb, {
        supplierId: 's',
        network: 'ariba',
        eventType: 'SYNC_REQUESTED',
        payload
      })
    ).rejects.toBeInstanceOf(Error);
  });

  it('covers idempotency race reconciliation mismatch fail-closed', async () => {
    const payload = { supplierId: 's', action: 'SYNC' };
    const payloadHash = createPayloadHash(payload);
    const idempotencyKey = createIdempotencyKey('ariba', 's', payload);

    const existingRow = {
      id: '1',
      supplier_id: 's',
      network: 'ariba',
      payload,
      payload_hash: `${payloadHash.slice(0, 8)}bad`,
      idempotency_key: idempotencyKey,
      status: 'queued',
      attempt_count: 0,
      last_error: null,
      available_at: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      created_at: new Date('2025-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date('2025-01-01T00:00:00.000Z').toISOString()
    };

    let step = 0;
    const fakeDb: DbClient = {
      query: async <T = unknown>(sql: string): Promise<{ rows: T[] }> => {
        if (/^SELECT/i.test(sql) && step === 0) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^INSERT/i.test(sql) && step === 1) {
          step += 1;
          return { rows: [] as T[] };
        }
        if (/^SELECT/i.test(sql) && step === 2) {
          step += 1;
          return { rows: [existingRow] as unknown as T[] };
        }
        throw new Error('unexpected query');
      }
    };

    await expect(
      enqueueSyndicationJob(fakeDb, {
        supplierId: 's',
        network: 'ariba',
        eventType: 'SYNC_REQUESTED',
        payload
      })
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it('covers non-Error throw path in worker (Unknown syndication error)', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-9',
      network: 'ariba',
      payload: { supplierId: 'supplier-9', action: 'SYNC' }
    });

    const throwsString: Connector = {
      name: 'ariba',
      send: async () => {
        throw 'boom';
      },
      healthCheck: async () => true
    };

    await processNextSyndicationJob({
      db,
      logger,
      config: { maxAttempts: 2, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { ariba: throwsString }
    });

    const job = await raw.query("SELECT status, last_error FROM syndication_jobs WHERE supplier_id = 'supplier-9'");
    expect((job.rows[0] as { status: string }).status).toBe('failed');
    expect((job.rows[0] as { last_error: string }).last_error).toMatch(/unknown syndication error/i);
  });

  it('covers startSyndicationWorker branch when a job is processed (no sleep)', async () => {
    const { logger } = createTestLogger();

    await emitSyncRequested({
      db,
      logger,
      supplierId: 'supplier-10',
      network: 'ariba',
      payload: { supplierId: 'supplier-10', action: 'SYNC' }
    });

    const ok: Connector = {
      name: 'ariba',
      send: async () => ({ ok: true, externalId: 'x' }),
      healthCheck: async () => true
    };

    await startSyndicationWorker({
      db,
      logger,
      config: { maxAttempts: 5, retryBaseMs: 0, pollIntervalMs: 0 },
      connectors: { ariba: ok },
      maxIterations: 1,
      sleep: async () => undefined
    });
  });
});
