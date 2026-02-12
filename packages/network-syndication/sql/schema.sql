-- Network Syndication outbound bus schema (Postgres)
-- Queue + idempotency + persistence + audit

CREATE TABLE IF NOT EXISTS syndication_jobs (
  id BIGSERIAL PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  network TEXT NOT NULL,
  payload JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT syndication_jobs_status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead')),
  CONSTRAINT syndication_jobs_attempt_count_check CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS syndication_jobs_supplier_network_idx
  ON syndication_jobs (supplier_id, network);

CREATE INDEX IF NOT EXISTS syndication_jobs_ready_idx
  ON syndication_jobs (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS syndication_audit (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES syndication_jobs(id) ON DELETE RESTRICT,
  supplier_id TEXT NOT NULL,
  network TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS syndication_audit_supplier_idx
  ON syndication_audit (supplier_id, created_at DESC);
