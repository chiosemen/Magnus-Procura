import { Pool } from 'pg';

import { env } from '../config/env.js';
import { logger } from './logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL
});

pool.on('error', (error: Error) => {
  logger.error(
    { err: error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) } },
    'db_pool_error'
  );
});

export const db = {
  query: async <T = unknown>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }> => {
    const result = await pool.query(sql, params as unknown[] | undefined);
    return { rows: result.rows as T[] };
  }
};
