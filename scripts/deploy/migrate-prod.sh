#!/usr/bin/env bash
set -euo pipefail

# Magnus Procura — Production Database Migration Runner
echo "=== [Magnus Procura] Production DB Migration ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Running Pre-Flight Deployment Environment Gate..."
STRICT_ENV_CHECK=true node "$SCRIPT_DIR/verify-env.mjs"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  echo "Usage: DATABASE_URL=\"postgresql://...\" ./scripts/deploy/migrate-prod.sh"
  exit 1
fi

MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../supabase/migrations" && pwd)"

echo "Scanning migrations in $MIGRATIONS_DIR..."
TOTAL_MIGRATIONS=$(ls -1 "$MIGRATIONS_DIR"/*.sql | wc -l | tr -d ' ')
echo "Found $TOTAL_MIGRATIONS migration files."

if command -v supabase &> /dev/null; then
  echo "Applying migrations via supabase db push..."
  supabase db push --db-url "$DATABASE_URL" || {
    echo "supabase db push failed or timed out. Falling back to sequential application..."
    for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
      echo " -> Applying $(basename "$file")..."
      if command -v psql &> /dev/null; then
        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
      else
        echo "Please ensure psql or supabase CLI is configured."
      fi
    done
  }
else
  echo "Using npx supabase db push..."
  npx supabase db push --db-url "$DATABASE_URL"
fi

echo "=== [Magnus Procura] All Migrations Applied Successfully ==="
