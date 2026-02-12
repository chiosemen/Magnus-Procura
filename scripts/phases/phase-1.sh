#!/usr/bin/env bash
set -euo pipefail

node scripts/invariants/check-no-cdn.mjs
node -e "const p=require('./package.json'); if(!p.packageManager||!p.engines?.node){throw new Error('toolchain pinning missing')}"

echo "PHASE 1 PASS"
