-- Magnus Procura Scoring Engine schema (Postgres)
-- Queue + idempotency + persistence + audit + explainability

CREATE TABLE IF NOT EXISTS scoring_jobs (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  triggered_by JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scoring_jobs_status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dead')),
  CONSTRAINT scoring_jobs_attempt_count_check CHECK (attempt_count >= 0)
);

CREATE INDEX IF NOT EXISTS scoring_jobs_ready_idx
  ON scoring_jobs (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS scoring_scores (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scoring_scores_score_check CHECK (score >= 0 AND score <= 100)
);

CREATE TABLE IF NOT EXISTS scoring_explanations (
  score_id BIGINT PRIMARY KEY REFERENCES scoring_scores(id) ON DELETE CASCADE,
  rule_hits JSONB NOT NULL,
  feature_values JSONB NOT NULL,
  ml_confidence NUMERIC NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS scoring_audit (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES scoring_jobs(id) ON DELETE RESTRICT,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scoring_audit_entity_idx
  ON scoring_audit (entity_id, created_at DESC);

-- Policy evaluations (deterministic compliance audit)
CREATE TABLE IF NOT EXISTS policy_evaluations (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  result TEXT NOT NULL,
  reasons JSONB NOT NULL,
  metadata JSONB NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT policy_evaluations_result_check CHECK (result IN ('PASS', 'FAIL', 'WARN'))
);

CREATE INDEX IF NOT EXISTS policy_evaluations_entity_rule_idx
  ON policy_evaluations (entity_id, rule_id, evaluated_at DESC);
