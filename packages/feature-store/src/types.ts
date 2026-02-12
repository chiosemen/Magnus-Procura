import type { z } from 'zod';

export type FeatureDefinition = Readonly<{
  name: string;
  version: number;
  schema: z.ZodType<unknown>;
  description: string;
}>;

export type FeatureWriteInput = Readonly<{
  entity_id: string;
  feature_name: string;
  feature_value: unknown;
  feature_version: number;
  source_event: string;
  idempotency_key: string;
}>;

export type FeatureRecord = Readonly<{
  id: string;
  entity_id: string;
  feature_name: string;
  feature_value: unknown;
  feature_version: number;
  source_event: string;
  idempotency_key: string;
  created_at: Date;
  updated_at: Date;
}>;

export type FeatureWriteResult =
  | Readonly<{ status: 'written'; record: FeatureRecord }>
  | Readonly<{ status: 'skipped'; record: FeatureRecord }>;

export type FeatureStore = Readonly<{
  registerFeatureSchema: (definition: FeatureDefinition) => void;
  writeFeature: (input: FeatureWriteInput) => Promise<FeatureWriteResult>;
  readFeature: (entity_id: string, feature_name: string) => Promise<FeatureRecord | null>;
  readAllFeatures: (entity_id: string) => Promise<ReadonlyArray<FeatureRecord>>;
}>;

export type FeatureStoreProvider = Readonly<{
  getByIdempotencyKey: (idempotency_key: string) => Promise<FeatureRecord | null>;
  getLatest: (entity_id: string, feature_name: string) => Promise<FeatureRecord | null>;
  getAllLatest: (entity_id: string) => Promise<ReadonlyArray<FeatureRecord>>;
  insert: (record: FeatureRecord) => Promise<void>;
}>;

export class FeatureStoreError extends Error {
  public override readonly name: string = 'FeatureStoreError';
}

export class FeatureSchemaNotRegisteredError extends FeatureStoreError {
  public override readonly name: string = 'FeatureSchemaNotRegisteredError';
  public constructor(featureName: string, version: number) {
    super(`Feature schema not registered: ${featureName}@v${String(version)}`);
  }
}

export class FeatureSchemaAlreadyRegisteredError extends FeatureStoreError {
  public override readonly name: string = 'FeatureSchemaAlreadyRegisteredError';
  public constructor(featureName: string, version: number) {
    super(`Feature schema already registered with conflicting definition: ${featureName}@v${String(version)}`);
  }
}

export class FeatureValidationError extends FeatureStoreError {
  public override readonly name: string = 'FeatureValidationError';
  public constructor(message: string) {
    super(message);
  }
}

export class FeatureVersionMismatchError extends FeatureStoreError {
  public override readonly name: string = 'FeatureVersionMismatchError';
  public constructor(featureName: string, expectedVersion: number, actualVersion: number) {
    super(
      `Feature version mismatch for ${featureName}: expected v${String(expectedVersion)}, got v${String(actualVersion)}`
    );
  }
}

export class FeatureIdempotencyConflictError extends FeatureStoreError {
  public override readonly name: string = 'FeatureIdempotencyConflictError';
  public constructor(idempotencyKey: string) {
    super(`Idempotency key conflict: ${idempotencyKey}`);
  }
}
