#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f docs/SECURITY_BASELINE.md || ! -f docs/AUTH_RBAC.md || ! -f docs/OBSERVABILITY.md || ! -f docs/CI_GATES.md ]]; then
  echo "Required audit docs are missing" >&2
  exit 1
fi

pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm invariant:ci

echo "PHASE 0 PASS"
