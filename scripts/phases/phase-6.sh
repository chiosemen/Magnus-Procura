#!/usr/bin/env bash
set -euo pipefail

pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm invariant:ci

echo "PHASE 6 PASS"
