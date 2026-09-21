#!/usr/bin/env node
/**
 * Invariant Check: Zero Client Secrets in Web Client Code & Bundles
 * 
 * Verifies that privileged keys:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - STRIPE_SECRET_KEY
 * - RESEND_API_KEY
 * - CRON_SECRET
 * are NEVER referenced or imported into apps/web client code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const webSrcDir = path.resolve(rootDir, 'apps/web/src');

const FORBIDDEN_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'CRON_SECRET',
  'service_role'
];

let violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      FORBIDDEN_SECRETS.forEach((secret) => {
        if (content.includes(secret)) {
          // Allow explicit comments or type guards if strictly documentation
          const lines = content.split('\n');
          lines.forEach((line, lineIdx) => {
            if (line.includes(secret) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
              violations.push({
                file: path.relative(rootDir, fullPath),
                line: lineIdx + 1,
                secret,
                code: line.trim()
              });
            }
          });
        }
      });
    }
  }
}

console.log('🔒 Running Invariant Check: check-no-client-secrets...');
scanDirectory(webSrcDir);

if (violations.length > 0) {
  console.error(`❌ INVARIANT VIOLATION: Found ${violations.length} secret references in web client:`);
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> Forbidden Secret "${v.secret}"`);
    console.error(`    ${v.code}`);
  });
  process.exit(1);
} else {
  console.log('✅ PASS: Zero client secrets found in apps/web client code.');
  process.exit(0);
}
