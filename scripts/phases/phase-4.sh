#!/usr/bin/env bash
set -euo pipefail

node scripts/invariants/check-env-validation.mjs
node -e "const fs=require('fs');const app=fs.readFileSync('apps/web/src/App.tsx','utf8');if(/Switch Perspective|setUserRole|onSelectRole/.test(app)){throw new Error('client-side role toggle detected')}"
node -e "const fs=require('fs');const svc=fs.readFileSync('apps/web/src/services/gemini.ts','utf8');if(/@google\/genai/.test(svc)){throw new Error('provider sdk must be server-side only')}"

echo "PHASE 4 PASS"
