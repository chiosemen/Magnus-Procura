export type ScoringEventType =
  | 'SUPPLIER_PROFILE_UPDATED'
  | 'DOCUMENT_UPLOADED'
  | 'CREDENTIAL_EXPIRED'
  | 'EXTERNAL_SYNC_UPDATED'
  | 'ADMIN_OVERRIDE';

export type ScoringJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'dead';

export interface ScoringEvent {
  entityId: string;
  eventType: ScoringEventType;
  payload: unknown;
  triggeredBy: {
    username: string;
    role: string;
  };
}

export interface ScoringJobRecord {
  id: string;
  entity_id: string;
  event_type: ScoringEventType;
  idempotency_key: string;
  status: ScoringJobStatus;
  attempt_count: number;
  last_error: string | null;
  available_at: string;
  created_at: string;
  updated_at: string;
  payload: unknown;
  triggered_by: unknown;
}

export interface ScoringScoreRecord {
  id: string;
  entity_id: string;
  event_type: ScoringEventType;
  score: number;
  created_at: string;
}

export interface ScoringExplanationRecord {
  score_id: string;
  rule_hits: unknown;
  feature_values: unknown;
  ml_confidence: number | null;
  timestamp: string;
}

export interface ScoringAuditRecord {
  id: string;
  job_id: string;
  entity_id: string;
  event_type: ScoringEventType;
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

export interface WorkerConfig {
  maxAttempts: number;
  retryBaseMs: number;
  pollIntervalMs: number;
  mlMode: 'disabled' | 'required';
}
