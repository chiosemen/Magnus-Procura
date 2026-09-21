#!/usr/bin/env node
/**
 * Invariant Check: 100% RLS Coverage and FORCE ROW LEVEL SECURITY on All Tables
 * 
 * Inspects all production SQL migrations to ensure all 25 tables have:
 * 1. ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
 * 2. ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
 * 3. At least one CREATE POLICY defined.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const migrationsDir = path.resolve(rootDir, 'supabase/migrations');

const EXPECTED_TABLES = [
  'profiles',
  'organizations',
  'org_members',
  'programs',
  'fit_reviews',
  'packets',
  'artifacts',
  'account_targets',
  'people',
  'intros',
  'stage_transitions',
  'events',
  'opportunities',
  'attestations',
  'partners',
  'referrals',
  'bounties',
  'invoices',
  'operator_assignments',
  'operator_hours',
  'cohorts',
  'cohort_members',
  'score_snapshots',
  'audit_log',
  'stripe_events',
  'do_not_serve'
];

const EXPECTED_VIEWS = [
  'member_funnel',
  'programs_sla',
  'cohort_card',
  'partner_scorecard',
  'unit_econ_run'
];

console.log('🔒 Running Invariant Check: check-rls-coverage (Tables + Views)...');

if (!fs.existsSync(migrationsDir)) {
  console.error(`❌ Migrations directory not found: ${migrationsDir}`);
  process.exit(1);
}

// Concatenate all SQL migration contents
const sqlFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
const allSql = sqlFiles.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

let errors = [];

EXPECTED_TABLES.forEach((table) => {
  const enableRegex = new RegExp(`ALTER\\s+TABLE\\s+(public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  const forceRegex = new RegExp(`ALTER\\s+TABLE\\s+(public\\.)?${table}\\s+FORCE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  const policyRegex = new RegExp(`CREATE\\s+POLICY\\s+("[^"]+"|[a-zA-Z0-9_]+)\\s+ON\\s+(public\\.)?${table}\\b`, 'i');

  if (!enableRegex.test(allSql)) {
    errors.push(`Table "${table}" is missing ENABLE ROW LEVEL SECURITY`);
  }
  if (!forceRegex.test(allSql)) {
    errors.push(`Table "${table}" is missing FORCE ROW LEVEL SECURITY`);
  }
  if (!policyRegex.test(allSql)) {
    errors.push(`Table "${table}" has no explicit CREATE POLICY declared`);
  }
});

EXPECTED_VIEWS.forEach((view) => {
  // Check for either ALTER VIEW ... SET (security_invoker = true) or CREATE VIEW ... WITH (security_invoker = true)
  const alterInvokerRegex = new RegExp(`ALTER\\s+VIEW\\s+(public\\.)?${view}\\s+SET\\s*\\(\\s*security_invoker\\s*=\\s*true\\s*\\)`, 'i');
  const withInvokerRegex = new RegExp(`CREATE\\s+(OR\\s+REPLACE\\s+)?VIEW\\s+(public\\.)?${view}\\s+WITH\\s*\\(\\s*security_invoker\\s*=\\s*true\\s*\\)`, 'i');

  if (!alterInvokerRegex.test(allSql) && !withInvokerRegex.test(allSql)) {
    errors.push(`View "${view}" is missing security_invoker = true (RLS bypass vulnerability)`);
  }
});

if (errors.length > 0) {
  console.error(`❌ RLS COVERAGE VIOLATIONS (${errors.length}):`);
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log(`✅ PASS: All ${EXPECTED_TABLES.length} tables have ENABLE + FORCE ROW LEVEL SECURITY and active policies.`);
  console.log(`✅ PASS: All ${EXPECTED_VIEWS.length} SQL views enforce security_invoker = true (zero tenant leakage).`);
  process.exit(0);
}
