#!/usr/bin/env bash
set -euo pipefail

# Magnus Procura — Production Database Migration Runner
echo "=== [Magnus Procura] Production DB Migration ==="

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "Verifying Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI not found in PATH. Using npx supabase..."
  npx supabase db push --db-url "$DATABASE_URL"
else
  supabase db push --db-url "$DATABASE_URL"
fi

echo "=== [Magnus Procura] Migrations Applied Successfully ==="
