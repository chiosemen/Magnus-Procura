CREATE TABLE IF NOT EXISTS ml_features (
  id uuid PRIMARY KEY,
  entity_id text NOT NULL,
  feature_name text NOT NULL,
  feature_value jsonb NOT NULL,
  feature_version integer NOT NULL,
  source_event text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS ml_features_entity_feature_idx
  ON ml_features (entity_id, feature_name);

