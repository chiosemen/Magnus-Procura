#!/usr/bin/env bash
set -euo pipefail

node scripts/invariants/check-strict-ts.mjs
pnpm typecheck

echo "PHASE 2 PASS"
