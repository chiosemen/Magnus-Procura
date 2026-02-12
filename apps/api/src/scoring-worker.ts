import { startScoringWorker } from 'agent-tool-scoring';

import { env } from './config/env.js';
import { pool } from './lib/db.js';
import { logger } from './lib/logger.js';

logger.info(
  {
    maxAttempts: env.SCORING_WORKER_MAX_ATTEMPTS,
    retryBaseMs: env.SCORING_WORKER_RETRY_BASE_MS,
    pollIntervalMs: env.SCORING_WORKER_POLL_INTERVAL_MS,
    mlMode: env.SCORING_WORKER_ML_MODE
  },
  'scoring_worker_starting'
);

const client = await pool.connect();

try {
  await startScoringWorker({
    db: {
      query: async <T = unknown>(sql: string, params?: readonly unknown[]) => {
        const result = await client.query(sql, params as unknown[] | undefined);
        return { rows: result.rows as T[] };
      }
    },
    logger,
    config: {
      maxAttempts: env.SCORING_WORKER_MAX_ATTEMPTS,
      retryBaseMs: env.SCORING_WORKER_RETRY_BASE_MS,
      pollIntervalMs: env.SCORING_WORKER_POLL_INTERVAL_MS,
      mlMode: env.SCORING_WORKER_ML_MODE
    }
  });
} finally {
  client.release();
}
