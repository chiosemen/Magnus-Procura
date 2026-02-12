import { buildExplainability } from './explainability.js';
import { markJobCompleted, markJobFailed } from './idempotency.js';
import { scoreWithMl } from './ml/index.js';
import { runRuleEngine } from './rules/index.js';
import type { DbClient, Logger, ScoringEvent, ScoringJobRecord, WorkerConfig } from './types.js';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const claimNextJob = async (db: DbClient, maxAttempts: number): Promise<ScoringJobRecord | null> => {
  const result = await db.query<ScoringJobRecord>(
    `UPDATE scoring_jobs
     SET status = 'processing', updated_at = NOW()
     WHERE id = (
       SELECT id
       FROM scoring_jobs
       WHERE status IN ('queued', 'failed')
         AND available_at <= NOW()
         AND attempt_count < $1
       ORDER BY created_at ASC
       LIMIT 1
     )
     AND status IN ('queued', 'failed')
     RETURNING *`,
    [maxAttempts]
  );

  return result.rows[0] ?? null;
};

const parseJobEvent = (job: ScoringJobRecord): ScoringEvent => {
  return {
    entityId: job.entity_id,
    eventType: job.event_type,
    payload: job.payload,
    triggeredBy: job.triggered_by as { username: string; role: string }
  };
};

const withTransaction = async <T>(db: DbClient, fn: () => Promise<T>): Promise<T> => {
  await db.query('BEGIN');
  try {
    const result = await fn();
    await db.query('COMMIT');
    return result;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

export const processNextScoringJob = async (args: {
  db: DbClient;
  logger: Logger;
  config: WorkerConfig;
}): Promise<{ processed: boolean; jobId?: string }> => {
  const job = await claimNextJob(args.db, args.config.maxAttempts);
  if (job == null) {
    return { processed: false };
  }

  const event = parseJobEvent(job);

  args.logger.info(
    {
      jobId: job.id,
      entityId: job.entity_id,
      eventType: job.event_type,
      attemptCount: job.attempt_count
    },
    'job_received'
  );

  try {
    const ruleResult = runRuleEngine(event);
    const mlResult = await scoreWithMl({
      mode: args.config.mlMode,
      eventType: event.eventType,
      payload: event.payload
    });

    const score = clamp(
      Math.round(ruleResult.baseScore + (mlResult?.scoreDelta ?? 0)),
      0,
      100
    );

    const explainability = buildExplainability({
      ruleHits: ruleResult.ruleHits,
      featureValues: {
        ...ruleResult.featureValues,
        ...(mlResult ? { mlFeatures: mlResult.features } : {})
      },
      mlConfidence: mlResult?.confidence ?? null
    });

    await withTransaction(args.db, async () => {
      const scoreInsert = await args.db.query<{ id: string }>(
        `INSERT INTO scoring_scores (entity_id, event_type, score)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [event.entityId, event.eventType, score]
      );

      const scoreId = scoreInsert.rows[0]?.id;
      if (!scoreId) {
        throw new Error('Failed to persist score');
      }

      await args.db.query(
        `INSERT INTO scoring_explanations (score_id, rule_hits, feature_values, ml_confidence, timestamp)
         VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::timestamptz)`,
        [
          scoreId,
          JSON.stringify(explainability.ruleHits),
          JSON.stringify(explainability.featureValues),
          explainability.mlConfidence,
          explainability.timestamp
        ]
      );

      await args.db.query(
        `INSERT INTO scoring_audit (job_id, entity_id, event_type, idempotency_key, action, payload)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          job.id,
          event.entityId,
          event.eventType,
          job.idempotency_key,
          'SCORE_PERSISTED',
          JSON.stringify({ score, explainability })
        ]
      );

      await markJobCompleted(args.db, job.id);
    });

    args.logger.info(
      { jobId: job.id, entityId: job.entity_id, eventType: job.event_type, score },
      'job_completed'
    );

    return { processed: true, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scoring error';

    const updated = await markJobFailed(args.db, {
      jobId: job.id,
      errorMessage: message,
      attemptCount: job.attempt_count,
      maxAttempts: args.config.maxAttempts,
      retryBaseMs: args.config.retryBaseMs
    });

    args.logger.error(
      {
        jobId: job.id,
        entityId: job.entity_id,
        eventType: job.event_type,
        attemptCount: updated.attempt_count,
        status: updated.status,
        lastError: updated.last_error
      },
      'job_failed'
    );

    return { processed: true, jobId: job.id };
  }
};

export const startScoringWorker = async (args: { db: DbClient; logger: Logger; config: WorkerConfig }): Promise<void> => {
  for (;;) {
    const result = await processNextScoringJob(args);
    if (!result.processed) {
      await new Promise((resolve) => setTimeout(resolve, args.config.pollIntervalMs));
    }
  }
};
