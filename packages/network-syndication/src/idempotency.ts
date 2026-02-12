import crypto from 'node:crypto';

import type { DbClient, Network, SyndicationEvent, SyndicationJobRecord } from './types.js';
import { IdempotencyConflictError } from './types.js';
import { computeBackoffMs } from './retry.js';

const canonicalize = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return JSON.stringify(String(value));
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return JSON.stringify(String(value));
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(record[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
};

export const createPayloadHash = (payload: unknown): string => {
  const hash = crypto.createHash('sha256');
  hash.update(canonicalize(payload));
  return hash.digest('hex');
};

export const createIdempotencyKey = (network: Network, supplierId: string, payload: unknown): string => {
  const hash = crypto.createHash('sha256');
  hash.update(network);
  hash.update('|');
  hash.update(supplierId);
  hash.update('|');
  hash.update(canonicalize(payload));
  return `synd:${network}:${hash.digest('hex')}`;
};

export const enqueueSyndicationJob = async (
  db: DbClient,
  event: SyndicationEvent
): Promise<{ job: SyndicationJobRecord; created: boolean; idempotencyKey: string; payloadHash: string }> => {
  const payloadHash = createPayloadHash(event.payload);
  const key = createIdempotencyKey(event.network, event.supplierId, event.payload);

  const existingBefore = await db.query<SyndicationJobRecord>(
    `SELECT *
     FROM syndication_jobs
     WHERE idempotency_key = $1
     LIMIT 1`,
    [key]
  );

  const existingRowBefore = existingBefore.rows[0];
  if (existingRowBefore) {
    if (existingRowBefore.payload_hash !== payloadHash) {
      throw new IdempotencyConflictError('Idempotency key exists with different payload_hash');
    }
    return { job: existingRowBefore, created: false, idempotencyKey: key, payloadHash };
  }

  const inserted = await db.query<SyndicationJobRecord>(
    `INSERT INTO syndication_jobs (
        supplier_id,
        network,
        payload,
        payload_hash,
        idempotency_key,
        status,
        attempt_count,
        last_error,
        available_at
      )
      VALUES ($1, $2, $3::jsonb, $4, $5, 'queued', 0, NULL, NOW())
      ON CONFLICT (idempotency_key)
      DO NOTHING
      RETURNING *`,
    [event.supplierId, event.network, JSON.stringify(event.payload), payloadHash, key]
  );

  const insertedRow = inserted.rows[0];
  if (insertedRow) {
    return { job: insertedRow, created: true, idempotencyKey: key, payloadHash };
  }

  const existing = await db.query<SyndicationJobRecord>(
    `SELECT *
     FROM syndication_jobs
     WHERE idempotency_key = $1
     LIMIT 1`,
    [key]
  );

  const row = existing.rows[0];
  if (!row) {
    throw new Error('Failed to enqueue syndication job (idempotency conflict but no existing row found)');
  }
  if (row.payload_hash !== payloadHash) {
    throw new IdempotencyConflictError('Idempotency key exists with different payload_hash');
  }

  return { job: row, created: false, idempotencyKey: key, payloadHash };
};

export const markJobFailed = async (
  db: DbClient,
  args: {
    jobId: string;
    errorMessage: string;
    attemptCount: number;
    maxAttempts: number;
    retryBaseMs: number;
  }
): Promise<SyndicationJobRecord> => {
  const nextAttempt = args.attemptCount + 1;
  const terminal = nextAttempt >= args.maxAttempts;
  const status = terminal ? 'dead' : 'failed';
  const backoffMs = terminal ? 0 : computeBackoffMs(args.retryBaseMs, nextAttempt);

  const updated = await db.query<SyndicationJobRecord>(
    `UPDATE syndication_jobs
     SET status = $2,
         attempt_count = $3,
         last_error = $4,
         available_at = CASE WHEN $2 = 'dead' THEN NOW() ELSE NOW() + ($5::int || ' milliseconds')::interval END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [args.jobId, status, nextAttempt, args.errorMessage.slice(0, 4000), Math.trunc(backoffMs)]
  );

  const row = updated.rows[0];
  if (!row) {
    throw new Error('Failed to update syndication job failure state');
  }
  return row;
};

export const markJobCompleted = async (db: DbClient, jobId: string): Promise<SyndicationJobRecord> => {
  const updated = await db.query<SyndicationJobRecord>(
    `UPDATE syndication_jobs
     SET status = 'completed', last_error = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [jobId]
  );

  const row = updated.rows[0];
  if (!row) {
    throw new Error('Failed to mark syndication job completed');
  }
  return row;
};
