import type { DbClient, ScoringEvent, ScoringJobRecord } from './types.js';
import { createIdempotencyKey } from './events.js';

export const enqueueScoringJob = async (
  db: DbClient,
  event: ScoringEvent
): Promise<{ job: ScoringJobRecord; created: boolean; idempotencyKey: string }> => {
  const key = createIdempotencyKey(event.eventType, event.entityId, event.payload);

  const existingBefore = await db.query<ScoringJobRecord>(
    `SELECT *
     FROM scoring_jobs
     WHERE idempotency_key = $1
     LIMIT 1`,
    [key]
  );

  const existingRowBefore = existingBefore.rows[0];
  if (existingRowBefore) {
    return { job: existingRowBefore, created: false, idempotencyKey: key };
  }

  const inserted = await db.query<ScoringJobRecord>(
    `INSERT INTO scoring_jobs (
        entity_id,
        event_type,
        idempotency_key,
        status,
        attempt_count,
        last_error,
        available_at,
        payload,
        triggered_by
      )
      VALUES ($1, $2, $3, 'queued', 0, NULL, NOW(), $4::jsonb, $5::jsonb)
      ON CONFLICT (idempotency_key)
      DO NOTHING
      RETURNING *`,
    [event.entityId, event.eventType, key, JSON.stringify(event.payload), JSON.stringify(event.triggeredBy)]
  );

  const insertedRow = inserted.rows[0];
  if (insertedRow) {
    return { job: insertedRow, created: true, idempotencyKey: key };
  }

  const existing = await db.query<ScoringJobRecord>(
    `SELECT *
     FROM scoring_jobs
     WHERE idempotency_key = $1
     LIMIT 1`,
    [key]
  );

  const row = existing.rows[0];
  if (!row) {
    throw new Error('Failed to enqueue scoring job (idempotency conflict but no existing row found)');
  }

  return { job: row, created: false, idempotencyKey: key };
};

export const ensureScoringJob = async (db: DbClient, event: ScoringEvent): Promise<ScoringJobRecord> => {
  const result = await enqueueScoringJob(db, event);
  return result.job;
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
): Promise<ScoringJobRecord> => {
  const nextAttempt = args.attemptCount + 1;
  const terminal = nextAttempt >= args.maxAttempts;
  const status = terminal ? 'dead' : 'failed';

  const backoffMs = Math.min(args.retryBaseMs * Math.pow(2, Math.max(0, nextAttempt - 1)), 60_000);

  const updated = await db.query<ScoringJobRecord>(
    `UPDATE scoring_jobs
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
    throw new Error('Failed to update job failure state');
  }

  return row;
};

export const markJobCompleted = async (db: DbClient, jobId: string): Promise<ScoringJobRecord> => {
  const updated = await db.query<ScoringJobRecord>(
    `UPDATE scoring_jobs
     SET status = 'completed', updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [jobId]
  );

  const row = updated.rows[0];
  if (!row) {
    throw new Error('Failed to mark job completed');
  }

  return row;
};
