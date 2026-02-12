-- Policy Engine schema (Postgres)
-- Deterministic, auditable compliance evaluation results

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

