import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';
import { newDb } from 'pg-mem';
import { z } from 'zod';

import { PostgresFeatureStoreProvider, createFeatureStore, type SqlClient } from '../src/index.ts';

const splitSqlStatements = (sql: string): string[] => {
  return sql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0)
    .map((stmt) => `${stmt};`);
};

const createTestDb = async (): Promise<{
  client: SqlClient;
  raw: { query: (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[] }> };
  close: () => void;
}> => {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = mem.adapters.createPg();
  const pool = new adapter.Pool();
  const pgClient = await pool.connect();

  const schemaPath = new URL('../sql/schema.sql', import.meta.url);
  const schema = await readFile(schemaPath, 'utf8');
  for (const stmt of splitSqlStatements(schema)) {
    await pgClient.query(stmt);
  }

  const client: SqlClient = {
    query: async <T = unknown>(sql: string, params?: readonly unknown[]) => {
      const result = await pgClient.query(sql, params ? [...params] : undefined);
      return { rows: result.rows as T[] };
    }
  };

  return {
    client,
    raw: {
      query: async (sql: string, params?: readonly unknown[]) => {
        const result = await pgClient.query(sql, params ? [...params] : undefined);
        return { rows: result.rows as unknown[] };
      }
    },
    close: () => pgClient.release()
  };
};

describe('feature-store postgres provider', () => {
  it('writes + reads consistently and enforces idempotency', async () => {
    const { client, raw, close } = await createTestDb();
    const provider = new PostgresFeatureStoreProvider(client);
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'risk_signal',
      version: 1,
      schema: z.object({ score: z.number() }).strict(),
      description: 'Risk score signal'
    });

    const first = await store.writeFeature({
      entity_id: 'supplier-1',
      feature_name: 'risk_signal',
      feature_version: 1,
      feature_value: { score: 42 },
      source_event: 'SUPPLIER_PROFILE_UPDATED',
      idempotency_key: 'idem-pg-1'
    });
    expect(first.status).toBe('written');

    const second = await store.writeFeature({
      entity_id: 'supplier-1',
      feature_name: 'risk_signal',
      feature_version: 1,
      feature_value: { score: 42 },
      source_event: 'SUPPLIER_PROFILE_UPDATED',
      idempotency_key: 'idem-pg-1'
    });
    expect(second.status).toBe('skipped');

    const read = await store.readFeature('supplier-1', 'risk_signal');
    expect(read?.feature_value).toEqual({ score: 42 });

    const all = await store.readAllFeatures('supplier-1');
    expect(all).toHaveLength(1);

    const count = await raw.query('SELECT COUNT(*)::int AS c FROM ml_features');
    const cSchema = z.object({ c: z.number().int() }).strict();
    const parsed = cSchema.parse(count.rows[0]);
    expect(parsed.c).toBe(1);

    close();
  });
});
