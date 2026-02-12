import type { Connector, ConnectorSendResult } from '../types.js';

export const aribaConnector: Connector = {
  name: 'ariba',
  send: async (): Promise<ConnectorSendResult> => {
    return { ok: false, error: 'UNCONFIGURED_CONNECTOR' };
  },
  healthCheck: async (): Promise<boolean> => {
    return false;
  }
};

