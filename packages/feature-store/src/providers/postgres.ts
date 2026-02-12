import { z } from 'zod';

import type { FeatureRecord, FeatureStoreProvider } from '../types.js';

export type SqlClient = Readonly<{
  query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<{ rows: T[] }>;
}>;

const rowSchema = z
  .object({
    id: z.string().min(1),
    entity_id: z.string().min(1),
    feature_name: z.string().min(1),
    feature_value: z.unknown(),
    feature_version: z.number().int(),
    source_event: z.string().min(1),
    idempotency_key: z.string().min(1),
    created_at: z.union([z.date(), z.string()]),
    updated_at: z.union([z.date(), z.string()])
  })
  .strict();

const coerceDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return d;
};

const parseRow = (value: unknown): FeatureRecord => {
  const parsed = rowSchema.parse(value);
  return {
    id: parsed.id,
    entity_id: parsed.entity_id,
    feature_name: parsed.feature_name,
    feature_value: parsed.feature_value,
    feature_version: parsed.feature_version,
    source_event: parsed.source_event,
    idempotency_key: parsed.idempotency_key,
    created_at: coerceDate(parsed.created_at),
    updated_at: coerceDate(parsed.updated_at)
  };
};

export class PostgresFeatureStoreProvider implements FeatureStoreProvider {
  public constructor(private readonly client: SqlClient) {}

  public async getByIdempotencyKey(idempotency_key: string): Promise<FeatureRecord | null> {
    const res = await this.client.query(
      `SELECT id, entity_id, feature_name, feature_value, feature_version, source_event, idempotency_key, created_at, updated_at
       FROM ml_features
       WHERE idempotency_key = $1
       LIMIT 1`,
      [idempotency_key]
    );
    const row = res.rows[0] as unknown;
    return row ? parseRow(row) : null;
  }

  public async getLatest(entity_id: string, feature_name: string): Promise<FeatureRecord | null> {
    const res = await this.client.query(
      `SELECT id, entity_id, feature_name, feature_value, feature_version, source_event, idempotency_key, created_at, updated_at
       FROM ml_features
       WHERE entity_id = $1 AND feature_name = $2
       ORDER BY updated_at DESC, created_at DESC, id DESC
       LIMIT 1`,
      [entity_id, feature_name]
    );
    const row = res.rows[0] as unknown;
    return row ? parseRow(row) : null;
  }

  public async getAllLatest(entity_id: string): Promise<ReadonlyArray<FeatureRecord>> {
    const res = await this.client.query(
      `SELECT DISTINCT ON (feature_name)
         id, entity_id, feature_name, feature_value, feature_version, source_event, idempotency_key, created_at, updated_at
       FROM ml_features
       WHERE entity_id = $1
       ORDER BY feature_name, updated_at DESC, created_at DESC, id DESC`,
      [entity_id]
    );
    return res.rows.map((r) => parseRow(r as unknown));
  }

  public async insert(record: FeatureRecord): Promise<void> {
    await this.client.query(
      `INSERT INTO ml_features (
         id, entity_id, feature_name, feature_value, feature_version, source_event, idempotency_key, created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        record.id,
        record.entity_id,
        record.feature_name,
        record.feature_value,
        record.feature_version,
        record.source_event,
        record.idempotency_key,
        record.created_at.toISOString(),
        record.updated_at.toISOString()
      ]
    );
  }
}
