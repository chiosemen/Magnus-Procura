export type Network = 'ariba' | 'coupa' | 'jaggaer';

export type SyndicationEventType = 'SYNC_REQUESTED';

export type SyndicationJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'dead';

export interface SyndicationEvent {
  supplierId: string;
  network: Network;
  eventType: SyndicationEventType;
  payload: unknown;
  requestedBy?: {
    username: string;
    role: string;
  };
}

export interface SyndicationJobRecord {
  id: string;
  supplier_id: string;
  network: string;
  payload: unknown;
  payload_hash: string;
  idempotency_key: string;
  status: SyndicationJobStatus;
  attempt_count: number;
  last_error: string | null;
  available_at: string;
  created_at: string;
  updated_at: string;
}

export interface SyndicationAuditRecord {
  id: string;
  job_id: string;
  supplier_id: string;
  network: string;
  idempotency_key: string;
  action: string;
  payload: unknown;
  created_at: string;
}

export interface DbClient {
  query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<{ rows: T[] }>;
}

export interface Logger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

export type ConnectorSendResult =
  | Readonly<{ ok: true; externalId?: string; details?: unknown }>
  | Readonly<{ ok: false; error: string; details?: unknown }>;

export interface Connector {
  name: Network;
  send: (payload: unknown) => Promise<ConnectorSendResult>;
  healthCheck: () => Promise<boolean>;
}

export interface WorkerConfig {
  maxAttempts: number;
  retryBaseMs: number;
  pollIntervalMs: number;
}

export class SyndicationError extends Error {
  public override readonly name: string = 'SyndicationError';
}

export class IdempotencyConflictError extends SyndicationError {
  public override readonly name: string = 'IdempotencyConflictError';
  public constructor(message: string) {
    super(message);
  }
}

export class ConnectorNotFoundError extends SyndicationError {
  public override readonly name: string = 'ConnectorNotFoundError';
  public constructor(network: string) {
    super(`Connector not found for network: ${network}`);
  }
}
