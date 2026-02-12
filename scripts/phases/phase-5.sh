#!/usr/bin/env bash
set -euo pipefail

node -e "const fs=require('fs');const logger=fs.readFileSync('apps/api/src/lib/logger.ts','utf8');if(!logger.includes('pino')) throw new Error('structured logger missing');"
node -e "const fs=require('fs');const telemetry=fs.readFileSync('apps/api/src/lib/telemetry.ts','utf8');if(!telemetry.includes('captureError')) throw new Error('telemetry capture missing');"
node -e "const fs=require('fs');const svc=fs.readFileSync('apps/api/src/services/geminiService.ts','utf8');if(/catch\\s*\\([^)]*\\)\\s*\\{\\s*return/.test(svc)) throw new Error('swallowed exception detected');"

echo "PHASE 5 PASS"
