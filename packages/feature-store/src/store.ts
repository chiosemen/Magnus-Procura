import { createHash } from 'node:crypto';

import type { FeatureDefinition, FeatureRecord, FeatureStore, FeatureStoreProvider, FeatureWriteInput, FeatureWriteResult } from './types.js';
import {
  FeatureIdempotencyConflictError,
  FeatureValidationError,
  FeatureVersionMismatchError
} from './types.js';
import { computeIdempotencyFingerprint, computeRecordFingerprint } from './audit.js';
import { FeatureSchemaRegistry } from './registry.js';
import { parseAndRejectUnknownFields, validateFeatureWriteInput, stableStringify } from './validators.js';

export type FeatureStoreClock = Readonly<{ now: () => Date }>;

const bytesToUuid = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

const deterministicUuidFromString = (value: string): string => {
  const digest = createHash('sha256').update(value, 'utf8').digest();
  const bytes = digest.subarray(0, 16);
  // RFC 4122 variant + "version 5"-style marker (deterministic, not random).
  const b6 = bytes[6] as number;
  const b8 = bytes[8] as number;
  bytes[6] = (b6 & 0x0f) | 0x50;
  bytes[8] = (b8 & 0x3f) | 0x80;
  return bytesToUuid(bytes);
};

const sameIdempotentWrite = (existing: FeatureRecord, intended: FeatureWriteInput): boolean => {
  const a = computeRecordFingerprint(existing);
  const b = computeIdempotencyFingerprint(intended);
  return a === b;
};

export class FeatureStoreImpl implements FeatureStore {
  private readonly registry = new FeatureSchemaRegistry();

  public constructor(
    private readonly provider: FeatureStoreProvider,
    private readonly clock: FeatureStoreClock = { now: () => new Date() }
  ) {}

  public registerFeatureSchema(definition: FeatureDefinition): void {
    this.registry.register(definition);
  }

  public async writeFeature(input: FeatureWriteInput): Promise<FeatureWriteResult> {
    validateFeatureWriteInput(input);

    const def = this.registry.get(input.feature_name, input.feature_version);
    const validatedValue = parseAndRejectUnknownFields(def.schema, input.feature_value);

    const existingByKey = await this.provider.getByIdempotencyKey(input.idempotency_key);
    if (existingByKey) {
      if (!sameIdempotentWrite(existingByKey, { ...input, feature_value: validatedValue })) {
        throw new FeatureIdempotencyConflictError(input.idempotency_key);
      }
      return { status: 'skipped', record: existingByKey };
    }

    const latest = await this.provider.getLatest(input.entity_id, input.feature_name);
    if (latest && latest.feature_version !== input.feature_version) {
      throw new FeatureVersionMismatchError(input.feature_name, latest.feature_version, input.feature_version);
    }

    const now = this.clock.now();
    const record: FeatureRecord = {
      id: deterministicUuidFromString(input.idempotency_key),
      entity_id: input.entity_id,
      feature_name: input.feature_name,
      feature_value: validatedValue,
      feature_version: input.feature_version,
      source_event: input.source_event,
      idempotency_key: input.idempotency_key,
      created_at: now,
      updated_at: now
    };

    try {
      await this.provider.insert(record);
    } catch (err) {
      const after = await this.provider.getByIdempotencyKey(input.idempotency_key);
      if (after && sameIdempotentWrite(after, { ...input, feature_value: validatedValue })) {
        return { status: 'skipped', record: after };
      }
      const message = err instanceof Error ? err.message : stableStringify(err);
      throw new FeatureValidationError(`Feature write failed: ${message}`);
    }

    return { status: 'written', record };
  }

  public async readFeature(entity_id: string, feature_name: string): Promise<FeatureRecord | null> {
    const latest = await this.provider.getLatest(entity_id, feature_name);
    if (!latest) {
      return null;
    }

    const def = this.registry.get(latest.feature_name, latest.feature_version);
    const validatedValue = parseAndRejectUnknownFields(def.schema, latest.feature_value);

    return { ...latest, feature_value: validatedValue };
  }

  public async readAllFeatures(entity_id: string): Promise<ReadonlyArray<FeatureRecord>> {
    const rows = await this.provider.getAllLatest(entity_id);
    return rows.map((row) => {
      const def = this.registry.get(row.feature_name, row.feature_version);
      const validatedValue = parseAndRejectUnknownFields(def.schema, row.feature_value);
      return { ...row, feature_value: validatedValue };
    });
  }
}

export const createFeatureStore = (args: Readonly<{ provider: FeatureStoreProvider; clock?: FeatureStoreClock }>): FeatureStore => {
  return new FeatureStoreImpl(args.provider, args.clock ?? { now: () => new Date() });
};
