export type { FeatureDefinition, FeatureRecord, FeatureStore, FeatureStoreProvider, FeatureWriteInput, FeatureWriteResult } from './types.js';
export {
  FeatureStoreError,
  FeatureSchemaAlreadyRegisteredError,
  FeatureSchemaNotRegisteredError,
  FeatureValidationError,
  FeatureVersionMismatchError,
  FeatureIdempotencyConflictError
} from './types.js';

export { FeatureStoreImpl, createFeatureStore } from './store.js';
export { FeatureSchemaRegistry } from './registry.js';

export { InMemoryFeatureStoreProvider } from './providers/memory.js';
export { PostgresFeatureStoreProvider, type SqlClient } from './providers/postgres.js';
