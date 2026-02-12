-- Magnus Procura Agent Layer schema (Postgres)
-- Audit-first, fail-closed, replayable metadata (no authoritative business state)

CREATE TABLE IF NOT EXISTS supplier_accounts (
  supplier_id TEXT PRIMARY KEY,
  supplier_username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyer_supplier_access (
  buyer_username TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES supplier_accounts(supplier_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (buyer_username, supplier_id)
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL,
  input_summary JSONB NOT NULL,
  final_output JSONB NULL,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  CONSTRAINT agent_runs_status_check CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS agent_runs_user_created_idx
  ON agent_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_call_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  risk_tier INTEGER NOT NULL,
  input_payload JSONB NOT NULL,
  output_payload JSONB NULL,
  status TEXT NOT NULL,
  policy_decision JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  CONSTRAINT agent_tool_calls_status_check CHECK (status IN ('SUCCESS', 'FAIL', 'DENIED', 'SKIPPED_DUPLICATE')),
  CONSTRAINT agent_tool_calls_risk_tier_check CHECK (risk_tier >= 0 AND risk_tier <= 3)
);

CREATE INDEX IF NOT EXISTS agent_tool_calls_run_idx
  ON agent_tool_calls (run_id, created_at ASC);

-- Backwards-compatible upgrade for existing databases.
ALTER TABLE agent_tool_calls
  ADD COLUMN IF NOT EXISTS tool_call_id TEXT;
