#!/usr/bin/env bash
set -euo pipefail

node -e "const fs=require('fs');const html=fs.readFileSync('apps/web/index.html','utf8');if(!html.includes('Content-Security-Policy')) throw new Error('CSP missing in apps/web/index.html');if(!html.includes('Permissions-Policy')) throw new Error('Permissions-Policy missing in apps/web/index.html');"
node -e "const fs=require('fs');const app=fs.readFileSync('apps/api/src/app.ts','utf8');if(!app.includes('helmet(')) throw new Error('helmet not configured');if(!app.includes('Permissions-Policy')) throw new Error('permissions policy header missing');"
node -e "const metadata=require('./apps/web/metadata.json');if(metadata.requestFramePermissions){throw new Error('camera/microphone permissions must not be requested')}"

echo "PHASE 3 PASS"
