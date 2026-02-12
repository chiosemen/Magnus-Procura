export type {
  Connector,
  ConnectorSendResult,
  DbClient,
  Logger,
  Network,
  SyndicationAuditRecord,
  SyndicationEvent,
  SyndicationEventType,
  SyndicationJobRecord,
  SyndicationJobStatus,
  WorkerConfig
} from './types.js';

export { SyndicationError, IdempotencyConflictError, ConnectorNotFoundError } from './types.js';

export { buildSyncRequestedEvent } from './events.js';
export { createIdempotencyKey, createPayloadHash, enqueueSyndicationJob, markJobCompleted, markJobFailed } from './idempotency.js';
export { computeBackoffMs } from './retry.js';
export { emitSyncRequested } from './bus.js';
export { processNextSyndicationJob, startSyndicationWorker } from './worker.js';

