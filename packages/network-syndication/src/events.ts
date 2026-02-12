import type { Network, SyndicationEvent } from './types.js';

export const buildSyncRequestedEvent = (args: {
  supplierId: string;
  network: Network;
  payload: unknown;
  requestedBy?: SyndicationEvent['requestedBy'];
}): SyndicationEvent => {
  const base: Omit<SyndicationEvent, 'requestedBy'> = {
    supplierId: args.supplierId,
    network: args.network,
    eventType: 'SYNC_REQUESTED',
    payload: args.payload
  };

  return {
    ...base,
    ...(args.requestedBy ? { requestedBy: args.requestedBy } : {})
  };
};
