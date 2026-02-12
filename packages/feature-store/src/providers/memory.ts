import type { FeatureRecord, FeatureStoreProvider } from '../types.js';

export class InMemoryFeatureStoreProvider implements FeatureStoreProvider {
  private readonly byIdempotencyKey = new Map<string, FeatureRecord>();
  private readonly byEntityFeature = new Map<string, Map<string, FeatureRecord[]>>();
  private readonly byEntityAll = new Map<string, FeatureRecord[]>();

  public async getByIdempotencyKey(idempotency_key: string): Promise<FeatureRecord | null> {
    return this.byIdempotencyKey.get(idempotency_key) ?? null;
  }

  public async getLatest(entity_id: string, feature_name: string): Promise<FeatureRecord | null> {
    const byFeature = this.byEntityFeature.get(entity_id);
    const rows = byFeature?.get(feature_name);
    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[rows.length - 1]!;
  }

  public async getAllLatest(entity_id: string): Promise<ReadonlyArray<FeatureRecord>> {
    const rows = this.byEntityAll.get(entity_id) ?? [];
    if (rows.length === 0) {
      return [];
    }

    const latestByName = new Map<string, FeatureRecord>();
    for (const row of rows) {
      latestByName.set(row.feature_name, row);
    }

    return Array.from(latestByName.values()).sort((a, b) => a.feature_name.localeCompare(b.feature_name));
  }

  public async insert(record: FeatureRecord): Promise<void> {
    if (this.byIdempotencyKey.has(record.idempotency_key)) {
      // Fail-closed: callers must not write duplicates without idempotency pre-check.
      throw new Error(`Unique constraint violation: idempotency_key=${record.idempotency_key}`);
    }

    this.byIdempotencyKey.set(record.idempotency_key, record);

    const byFeature = this.byEntityFeature.get(record.entity_id) ?? new Map<string, FeatureRecord[]>();
    const rows = byFeature.get(record.feature_name) ?? [];
    rows.push(record);
    byFeature.set(record.feature_name, rows);
    this.byEntityFeature.set(record.entity_id, byFeature);

    const all = this.byEntityAll.get(record.entity_id) ?? [];
    all.push(record);
    this.byEntityAll.set(record.entity_id, all);
  }

  public getAllRowsForTesting(): ReadonlyArray<FeatureRecord> {
    return Array.from(this.byIdempotencyKey.values());
  }
}
