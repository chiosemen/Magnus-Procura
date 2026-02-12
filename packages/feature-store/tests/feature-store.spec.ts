import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  FeatureIdempotencyConflictError,
  FeatureValidationError,
  FeatureVersionMismatchError,
  InMemoryFeatureStoreProvider,
  createFeatureStore
} from '../src/index.ts';

describe('feature-store', () => {
  it('validates feature_value against schema and rejects unknown fields', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'risk_signal',
      version: 1,
      schema: z.object({ score: z.number().min(0).max(100) }).strict(),
      description: 'Risk score signal'
    });

    await expect(
      store.writeFeature({
        entity_id: 'supplier-1',
        feature_name: 'risk_signal',
        feature_version: 1,
        feature_value: { score: 50, extra: true },
        source_event: 'SUPPLIER_PROFILE_UPDATED',
        idempotency_key: 'idem-1'
      })
    ).rejects.toBeInstanceOf(FeatureValidationError);

    const ok = await store.writeFeature({
      entity_id: 'supplier-1',
      feature_name: 'risk_signal',
      feature_version: 1,
      feature_value: { score: 50 },
      source_event: 'SUPPLIER_PROFILE_UPDATED',
      idempotency_key: 'idem-2'
    });

    expect(ok.status).toBe('written');
    const read = await store.readFeature('supplier-1', 'risk_signal');
    expect(read?.feature_value).toEqual({ score: 50 });
  });

  it('suppresses duplicate writes via idempotency_key', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'doc_signal',
      version: 1,
      schema: z.object({ present: z.boolean() }).strict(),
      description: 'Document presence signal'
    });

    const first = await store.writeFeature({
      entity_id: 'supplier-2',
      feature_name: 'doc_signal',
      feature_version: 1,
      feature_value: { present: true },
      source_event: 'DOCUMENT_UPLOADED',
      idempotency_key: 'idem-dup'
    });
    expect(first.status).toBe('written');
    expect(provider.getAllRowsForTesting()).toHaveLength(1);

    const second = await store.writeFeature({
      entity_id: 'supplier-2',
      feature_name: 'doc_signal',
      feature_version: 1,
      feature_value: { present: true },
      source_event: 'DOCUMENT_UPLOADED',
      idempotency_key: 'idem-dup'
    });
    expect(second.status).toBe('skipped');
    expect(provider.getAllRowsForTesting()).toHaveLength(1);
  });

  it('errors on idempotency_key mismatch for differing payload', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'numeric_signal',
      version: 1,
      schema: z.object({ value: z.number() }).strict(),
      description: 'Numeric signal'
    });

    await store.writeFeature({
      entity_id: 'supplier-3',
      feature_name: 'numeric_signal',
      feature_version: 1,
      feature_value: { value: 1 },
      source_event: 'EXTERNAL_SYNC_UPDATED',
      idempotency_key: 'idem-mismatch'
    });

    await expect(
      store.writeFeature({
        entity_id: 'supplier-3',
        feature_name: 'numeric_signal',
        feature_version: 1,
        feature_value: { value: 2 },
        source_event: 'EXTERNAL_SYNC_UPDATED',
        idempotency_key: 'idem-mismatch'
      })
    ).rejects.toBeInstanceOf(FeatureIdempotencyConflictError);
  });

  it('rejects incompatible version for an existing entity + feature_name', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'drift_signal',
      version: 1,
      schema: z.object({ v: z.literal(1) }).strict(),
      description: 'Versioned signal'
    });
    store.registerFeatureSchema({
      name: 'drift_signal',
      version: 2,
      schema: z.object({ v: z.literal(2) }).strict(),
      description: 'Versioned signal'
    });

    await store.writeFeature({
      entity_id: 'supplier-4',
      feature_name: 'drift_signal',
      feature_version: 1,
      feature_value: { v: 1 },
      source_event: 'SUPPLIER_PROFILE_UPDATED',
      idempotency_key: 'idem-v1'
    });

    await expect(
      store.writeFeature({
        entity_id: 'supplier-4',
        feature_name: 'drift_signal',
        feature_version: 2,
        feature_value: { v: 2 },
        source_event: 'SUPPLIER_PROFILE_UPDATED',
        idempotency_key: 'idem-v2'
      })
    ).rejects.toBeInstanceOf(FeatureVersionMismatchError);
  });

  it('returns consistent reads after writes via readFeature + readAllFeatures', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    store.registerFeatureSchema({
      name: 'signal_a',
      version: 1,
      schema: z.object({ value: z.number() }).strict(),
      description: 'Signal A'
    });
    store.registerFeatureSchema({
      name: 'signal_b',
      version: 1,
      schema: z.object({ ok: z.boolean() }).strict(),
      description: 'Signal B'
    });

    await store.writeFeature({
      entity_id: 'supplier-5',
      feature_name: 'signal_a',
      feature_version: 1,
      feature_value: { value: 10 },
      source_event: 'EXTERNAL_SYNC_UPDATED',
      idempotency_key: 'idem-a'
    });
    await store.writeFeature({
      entity_id: 'supplier-5',
      feature_name: 'signal_b',
      feature_version: 1,
      feature_value: { ok: true },
      source_event: 'DOCUMENT_UPLOADED',
      idempotency_key: 'idem-b'
    });

    const a = await store.readFeature('supplier-5', 'signal_a');
    expect(a?.feature_value).toEqual({ value: 10 });

    const all = await store.readAllFeatures('supplier-5');
    expect(all.map((r) => r.feature_name)).toEqual(['signal_a', 'signal_b']);
  });
});

