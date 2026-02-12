import type { Connector, DbClient, Logger, Network, SyndicationJobRecord, WorkerConfig } from './types.js';
import { ConnectorNotFoundError } from './types.js';
import { writeAudit, logAttempt, logSuccess, logFailed, logDeadLetter } from './audit.js';
import { computeBackoffMs } from './retry.js';
import { markJobCompleted, markJobFailed } from './idempotency.js';

import { aribaConnector } from './connectors/ariba.js';
import { coupaConnector } from './connectors/coupa.js';
import { jaggaerConnector } from './connectors/jaggaer.js';

const defaultConnectors: Readonly<Record<Network, Connector>> = {
  ariba: aribaConnector,
  coupa: coupaConnector,
  jaggaer: jaggaerConnector
};

export const runInTransaction = async <T>(db: DbClient, fn: () => Promise<T>): Promise<T> => {
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

const claimNextJob = async (db: DbClient, maxAttempts: number): Promise<SyndicationJobRecord | null> => {
  const result = await db.query<SyndicationJobRecord>(
    `UPDATE syndication_jobs
     SET status = 'processing', updated_at = NOW()
     WHERE id = (
       SELECT id
       FROM syndication_jobs
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

const getConnector = (network: string, connectors: Readonly<Record<Network, Connector>>): Connector => {
  if (network === 'ariba' || network === 'coupa' || network === 'jaggaer') {
    return connectors[network];
  }
  throw new ConnectorNotFoundError(network);
};

export const processNextSyndicationJob = async (args: {
  db: DbClient;
  logger: Logger;
  config: WorkerConfig;
  connectors?: Readonly<Partial<Record<Network, Connector>>>;
}): Promise<{ processed: boolean; jobId?: string }> => {
  const job = await claimNextJob(args.db, args.config.maxAttempts);
  if (job == null) {
    return { processed: false };
  }

  const connectorMap: Readonly<Record<Network, Connector>> = {
    ...defaultConnectors,
    ...(args.connectors ?? {})
  };

  const attempt = job.attempt_count + 1;
  logAttempt(args.logger, { job, attempt });

  await writeAudit(args.db, {
    job,
    action: 'SYNDICATION_ATTEMPT',
    payload: { attempt, backoffMs: computeBackoffMs(args.config.retryBaseMs, attempt), status: job.status }
  });

  try {
    const connector = getConnector(job.network, connectorMap);
    const result = await connector.send(job.payload);
    if (!result.ok) {
      throw new Error(result.error);
    }

    await runInTransaction(args.db, async () => {
      await writeAudit(args.db, {
        job,
        action: 'SYNDICATION_SUCCESS',
        payload: { attempt, externalId: result.externalId ?? null, details: result.details ?? null }
      });

      await markJobCompleted(args.db, job.id);
    });

    logSuccess(args.logger, result.externalId ? { job, externalId: result.externalId } : { job });
    return { processed: true, jobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown syndication error';

    const updated = await markJobFailed(args.db, {
      jobId: job.id,
      errorMessage: message,
      attemptCount: job.attempt_count,
      maxAttempts: args.config.maxAttempts,
      retryBaseMs: args.config.retryBaseMs
    });

    await writeAudit(args.db, {
      job: updated,
      action: updated.status === 'dead' ? 'SYNDICATION_DEAD_LETTER' : 'SYNDICATION_FAILED',
      payload: { attempt: updated.attempt_count, lastError: updated.last_error, retryBaseMs: args.config.retryBaseMs }
    });

    logFailed(args.logger, { job: updated, status: updated.status, lastError: updated.last_error });
    if (updated.status === 'dead') {
      logDeadLetter(args.logger, { job: updated, lastError: updated.last_error });
    }

    return { processed: true, jobId: job.id };
  }
};

export const startSyndicationWorker = async (args: {
  db: DbClient;
  logger: Logger;
  config: WorkerConfig;
  connectors?: Readonly<Partial<Record<Network, Connector>>>;
  maxIterations?: number;
  shouldStop?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
}): Promise<void> => {
  const sleep = args.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let iterations = 0;
  for (;;) {
    if (args.shouldStop?.() === true) {
      return;
    }
    if (args.maxIterations != null && iterations >= args.maxIterations) {
      return;
    }

    const result = await processNextSyndicationJob(args);
    if (!result.processed) {
      await sleep(args.config.pollIntervalMs);
    }
    iterations += 1;
  }
};
