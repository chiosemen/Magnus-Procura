import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  FeatureSchemaAlreadyRegisteredError,
  FeatureSchemaNotRegisteredError,
  FeatureValidationError,
  InMemoryFeatureStoreProvider,
  FeatureStoreImpl,
  PostgresFeatureStoreProvider,
  createFeatureStore,
  type FeatureRecord,
  type FeatureStoreProvider,
  type FeatureWriteInput,
  type SqlClient
} from '../src/index.ts';
import { computeIdempotencyFingerprint, computeRecordFingerprint } from '../src/audit.js';
import { FeatureSchemaRegistry } from '../src/registry.js';
import {
  stableStringify,
  isPlainObject,
  parseAndRejectUnknownFields,
  validateIdentifier,
  validateFeatureDefinition,
  validateFeatureWriteInput
} from '../src/validators.js';

describe('feature-store coverage', () => {
  it('covers stableStringify branches and JSON safety', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify('x')).toBe('"x"');
    expect(stableStringify(true)).toBe('true');
    expect(stableStringify(false)).toBe('false');
    expect(stableStringify(1)).toBe('1');
    expect(stableStringify([1, 'a'])).toBe('[1,"a"]');
    expect(stableStringify({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');

    expect(() => stableStringify(Number.POSITIVE_INFINITY)).toThrow(FeatureValidationError);
    expect(() => stableStringify(BigInt(1))).toThrow(FeatureValidationError);
    expect(() => stableStringify(Symbol('x'))).toThrow(FeatureValidationError);
    expect(() => stableStringify(undefined)).toThrow(FeatureValidationError);
    expect(() => stableStringify(() => undefined)).toThrow(FeatureValidationError);
    expect(() => stableStringify(new Date())).toThrow(FeatureValidationError);

    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    expect(() => stableStringify(cyc)).toThrow(FeatureValidationError);
  });

  it('covers isPlainObject edge cases', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null) as Record<string, unknown>)).toBe(true);
  });

  it('covers identifier validation', () => {
    expect(() => validateIdentifier('x', '   ')).toThrow(FeatureValidationError);
    expect(() => validateIdentifier('x', 'ok')).not.toThrow();
  });

  it('rejects schema parse failures and transform/strip behavior', () => {
    const schema = z.object({ score: z.number() }).strict();
    expect(() => parseAndRejectUnknownFields(schema, { score: 'x' })).toThrow(FeatureValidationError);
    expect(() => parseAndRejectUnknownFields(schema, { score: 1, extra: true })).toThrow(FeatureValidationError);
    expect(() => parseAndRejectUnknownFields(schema, ['nope'])).toThrow(FeatureValidationError);

    const transforming = z.object({ score: z.number().transform((n) => n + 1) }).strict();
    expect(() => parseAndRejectUnknownFields(transforming, { score: 1 })).toThrow(FeatureValidationError);
  });

  it('covers feature definition + write input validators failure paths', () => {
    expect(() =>
      validateFeatureDefinition({
        name: '',
        version: 1,
        schema: z.object({ a: z.string() }).strict(),
        description: 'd'
      })
    ).toThrow(FeatureValidationError);

    expect(() =>
      validateFeatureDefinition({
        name: 'x',
        version: 0,
        schema: z.object({ a: z.string() }).strict(),
        description: 'd'
      })
    ).toThrow(FeatureValidationError);

    expect(() =>
      validateFeatureDefinition({
        name: 'x',
        version: 1,
        schema: 'not-a-zod',
        description: 'd'
      })
    ).toThrow(FeatureValidationError);

    expect(() => validateFeatureWriteInput({})).toThrow(FeatureValidationError);
  });

  it('covers registry conflict + missing schema', () => {
    const reg = new FeatureSchemaRegistry();
    const v1 = z.object({ v: z.literal(1) }).strict();
    const v1b = z.object({ v: z.literal(1) }).strict();

    reg.register({ name: 'x', version: 1, schema: v1, description: 'd' });
    reg.register({ name: 'x', version: 1, schema: v1, description: 'd' });

    expect(() => reg.register({ name: 'x', version: 1, schema: v1b, description: 'd' })).toThrow(
      FeatureSchemaAlreadyRegisteredError
    );
    expect(() => reg.get('missing', 1)).toThrow(FeatureSchemaNotRegisteredError);
  });

  it('covers audit fingerprints', () => {
    const input: FeatureWriteInput = {
      entity_id: 'e',
      feature_name: 'f',
      feature_value: { score: 1 },
      feature_version: 1,
      source_event: 'EVT',
      idempotency_key: 'idem'
    };
    const fp = computeIdempotencyFingerprint(input);
    expect(fp).toMatch(/^[a-f0-9]{64}$/);

    const record: FeatureRecord = {
      id: '00000000-0000-0000-0000-000000000000',
      entity_id: 'e',
      feature_name: 'f',
      feature_value: { score: 1 },
      feature_version: 1,
      source_event: 'EVT',
      idempotency_key: 'idem',
      created_at: new Date('2025-01-01T00:00:00.000Z'),
      updated_at: new Date('2025-01-01T00:00:00.000Z')
    };
    const rp = computeRecordFingerprint(record);
    expect(rp).toMatch(/^[a-f0-9]{64}$/);
  });

  it('covers store fail-closed behavior on missing schema + insert error paths', async () => {
    const inMem = new InMemoryFeatureStoreProvider();
    const store = createFeatureStore({
      provider: inMem,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });

    await expect(store.readFeature('e', 'missing')).resolves.toBeNull();
    await expect(
      store.writeFeature({
        entity_id: 'e',
        feature_name: 'missing',
        feature_version: 1,
        feature_value: { v: 1 },
        source_event: 'EVT',
        idempotency_key: 'idem'
      })
    ).rejects.toBeInstanceOf(FeatureSchemaNotRegisteredError);

    const racingProvider: FeatureStoreProvider = {
      getByIdempotencyKey: async (key) => inMem.getByIdempotencyKey(key),
      getLatest: async (e, f) => inMem.getLatest(e, f),
      getAllLatest: async (e) => inMem.getAllLatest(e),
      insert: async (record) => {
        await inMem.insert(record);
        throw new Error('simulated unique violation');
      }
    };

    const store2 = createFeatureStore({
      provider: racingProvider,
      clock: { now: () => new Date('2025-01-01T00:00:00.000Z') }
    });
    store2.registerFeatureSchema({
      name: 'signal',
      version: 1,
      schema: z.object({ v: z.number() }).strict(),
      description: 'd'
    });

    const a = await store2.writeFeature({
      entity_id: 'e',
      feature_name: 'signal',
      feature_version: 1,
      feature_value: { v: 1 },
      source_event: 'EVT',
      idempotency_key: 'idem-race'
    });
    expect(a.status).toBe('skipped');

    const b = await store2.writeFeature({
      entity_id: 'e',
      feature_name: 'signal',
      feature_version: 1,
      feature_value: { v: 1 },
      source_event: 'EVT',
      idempotency_key: 'idem-race'
    });
    expect(b.status).toBe('skipped');

    const failingProvider: FeatureStoreProvider = {
      getByIdempotencyKey: async () => null,
      getLatest: async () => null,
      getAllLatest: async () => [],
      insert: async () => {
        throw 'boom';
      }
    };
    const store3 = createFeatureStore({ provider: failingProvider });
    store3.registerFeatureSchema({
      name: 'signal',
      version: 1,
      schema: z.object({ v: z.number() }).strict(),
      description: 'd'
    });
    await expect(
      store3.writeFeature({
        entity_id: 'e',
        feature_name: 'signal',
        feature_version: 1,
        feature_value: { v: 1 },
        source_event: 'EVT',
        idempotency_key: 'idem-fail'
      })
    ).rejects.toBeInstanceOf(FeatureValidationError);

    const errorProvider: FeatureStoreProvider = {
      getByIdempotencyKey: async () => null,
      getLatest: async () => null,
      getAllLatest: async () => [],
      insert: async () => {
        throw new Error('boom');
      }
    };
    const store4 = createFeatureStore({ provider: errorProvider });
    store4.registerFeatureSchema({
      name: 'signal',
      version: 1,
      schema: z.object({ v: z.number() }).strict(),
      description: 'd'
    });
    await expect(
      store4.writeFeature({
        entity_id: 'e',
        feature_name: 'signal',
        feature_version: 1,
        feature_value: { v: 1 },
        source_event: 'EVT',
        idempotency_key: 'idem-fail-2'
      })
    ).rejects.toBeInstanceOf(FeatureValidationError);

    const implProvider = new InMemoryFeatureStoreProvider();
    const impl = new FeatureStoreImpl(implProvider);
    impl.registerFeatureSchema({
      name: 'impl_signal',
      version: 1,
      schema: z.object({ v: z.number() }).strict(),
      description: 'd'
    });
    const r = await impl.writeFeature({
      entity_id: 'e',
      feature_name: 'impl_signal',
      feature_version: 1,
      feature_value: { v: 1 },
      source_event: 'EVT',
      idempotency_key: 'idem-impl'
    });
    expect(r.status).toBe('written');
  });

  it('covers memory provider empty reads and duplicate insert error', async () => {
    const provider = new InMemoryFeatureStoreProvider();
    expect(await provider.getLatest('e', 'f')).toBeNull();
    expect(await provider.getAllLatest('e')).toEqual([]);

    const record: FeatureRecord = {
      id: '00000000-0000-0000-0000-000000000000',
      entity_id: 'e',
      feature_name: 'f',
      feature_value: { v: 1 },
      feature_version: 1,
      source_event: 'EVT',
      idempotency_key: 'idem',
      created_at: new Date('2025-01-01T00:00:00.000Z'),
      updated_at: new Date('2025-01-01T00:00:00.000Z')
    };
    await provider.insert(record);
    await expect(provider.insert(record)).rejects.toBeInstanceOf(Error);
  });

  it('covers postgres provider null reads and row parsing failures', async () => {
    const emptyClient: SqlClient = {
      query: async <T = unknown>() => ({ rows: [] as T[] })
    };
    const provider = new PostgresFeatureStoreProvider(emptyClient);
    expect(await provider.getByIdempotencyKey('x')).toBeNull();
    expect(await provider.getLatest('e', 'f')).toBeNull();
    expect(await provider.getAllLatest('e')).toEqual([]);

    const badTimestampClient: SqlClient = {
      query: async <T = unknown>() =>
        ({
          rows: [
            {
              id: '1',
              entity_id: 'e',
              feature_name: 'f',
              feature_value: { v: 1 },
              feature_version: 1,
              source_event: 'EVT',
              idempotency_key: 'k',
              created_at: 'not-a-date',
              updated_at: '2025-01-01T00:00:00.000Z'
            }
          ] as unknown as T[]
        }) satisfies { rows: T[] }
    };
    const provider2 = new PostgresFeatureStoreProvider(badTimestampClient);
    await expect(provider2.getByIdempotencyKey('k')).rejects.toBeInstanceOf(Error);

    const invalidRowClient: SqlClient = {
      query: async <T = unknown>() =>
        ({
          rows: [
            {
              id: '1'
            }
          ] as unknown as T[]
        }) satisfies { rows: T[] }
    };
    const provider3 = new PostgresFeatureStoreProvider(invalidRowClient);
    await expect(provider3.getByIdempotencyKey('k')).rejects.toBeInstanceOf(Error);

    const stringDateClient: SqlClient = {
      query: async <T = unknown>() =>
        ({
          rows: [
            {
              id: '1',
              entity_id: 'e',
              feature_name: 'f',
              feature_value: { v: 1 },
              feature_version: 1,
              source_event: 'EVT',
              idempotency_key: 'k',
              created_at: '2025-01-01T00:00:00.000Z',
              updated_at: '2025-01-01T00:00:00.000Z'
            }
          ] as unknown as T[]
        }) satisfies { rows: T[] }
    };
    const provider4 = new PostgresFeatureStoreProvider(stringDateClient);
    const row = await provider4.getByIdempotencyKey('k');
    expect(row?.created_at.toISOString()).toBe('2025-01-01T00:00:00.000Z');

    const dateInstanceClient: SqlClient = {
      query: async <T = unknown>() =>
        ({
          rows: [
            {
              id: '1',
              entity_id: 'e',
              feature_name: 'f',
              feature_value: { v: 1 },
              feature_version: 1,
              source_event: 'EVT',
              idempotency_key: 'k',
              created_at: new Date('2025-01-01T00:00:00.000Z'),
              updated_at: new Date('2025-01-01T00:00:00.000Z')
            }
          ] as unknown as T[]
        }) satisfies { rows: T[] }
    };
    const provider5 = new PostgresFeatureStoreProvider(dateInstanceClient);
    const row2 = await provider5.getByIdempotencyKey('k');
    expect(row2?.updated_at.toISOString()).toBe('2025-01-01T00:00:00.000Z');
  });
});
