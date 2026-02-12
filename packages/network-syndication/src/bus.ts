import type { DbClient, Logger, Network, SyndicationEvent, SyndicationJobRecord } from './types.js';
import { writeAudit, logEnqueued } from './audit.js';
import { enqueueSyndicationJob } from './idempotency.js';

export const emitSyncRequested = async (args: {
  db: DbClient;
  logger: Logger;
  supplierId: string;
  network: Network;
  payload: unknown;
  requestedBy?: SyndicationEvent['requestedBy'];
}): Promise<{ job: SyndicationJobRecord; created: boolean; idempotencyKey: string }> => {
  const base: Omit<SyndicationEvent, 'requestedBy'> = {
    supplierId: args.supplierId,
    network: args.network,
    eventType: 'SYNC_REQUESTED',
    payload: args.payload
  };
  const event: SyndicationEvent = { ...base, ...(args.requestedBy ? { requestedBy: args.requestedBy } : {}) };

  const result = await enqueueSyndicationJob(args.db, event);

  if (result.created) {
    await writeAudit(args.db, {
      job: result.job,
      action: 'SYNDICATION_ENQUEUED',
      payload: {
        eventType: event.eventType,
        requestedBy: event.requestedBy ?? null,
        payloadHash: result.payloadHash
      }
    });
  }

  logEnqueued(args.logger, {
    job: result.job,
    supplierId: args.supplierId,
    network: args.network,
    payloadHash: result.payloadHash,
    created: result.created
  });

  return { job: result.job, created: result.created, idempotencyKey: result.idempotencyKey };
};
