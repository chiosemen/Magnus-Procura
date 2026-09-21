#!/usr/bin/env node
/**
 * Invariant Check: 100% RLS Coverage and FORCE ROW LEVEL SECURITY on All Tables
 *
 * This check queries the live PostgreSQL catalog (pg_class / pg_policies) on a
 * database built by scripts/db/apply-migrations.mjs. It asserts, for every
 * application table in the `public` schema:
 *
 *   1. relrowsecurity      — ENABLE ROW LEVEL SECURITY
 *   2. relforcerowsecurity — FORCE ROW LEVEL SECURITY (owner is not exempt)
 *   3. at least one policy in pg_policies
 *
 * It previously regex-matched the migration *text*, which proved only that a
 * string appeared in a file — it could not detect a policy that failed to apply,
 * was later dropped, or was silently replaced. Tables are now discovered from
 * the catalog rather than a hardcoded list, so a newly added table without RLS
 * fails this check instead of passing unnoticed.
 */

import pg from 'pg';

// Tables that are infrastructure rather than tenant data. Anything not listed
// here is treated as an application table and must carry forced RLS.
const EXEMPT_TABLES = new Set([
  'schema_migrations',
]);

const connectionString = process.env.DATABASE_URL;

console.log('🔒 Running Invariant Check: check-rls-coverage (live catalog)...');

if (!connectionString) {
  // Fail closed in CI: a skipped security check must never read as a pass.
  if (process.env.CI) {
    console.error('❌ DATABASE_URL is not set. RLS coverage cannot be verified in CI.');
    process.exit(1);
  }
  console.error('❌ DATABASE_URL is not set.');
  console.error('   Start a local Postgres and run: pnpm db:setup');
  process.exit(1);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();
} catch (err) {
  console.error(`❌ Could not connect to the database: ${err.message}`);
  process.exit(1);
}

try {
  const { rows } = await client.query(`
    SELECT
      c.relname                                   AS table_name,
      c.relrowsecurity                            AS rls_enabled,
      c.relforcerowsecurity                       AS rls_forced,
      COALESCE(p.policy_count, 0)::int            AS policy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN (
      SELECT schemaname, tablename, COUNT(*) AS policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY schemaname, tablename
    ) p ON p.tablename = c.relname AND p.schemaname = n.nspname
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const tables = rows.filter((r) => !EXEMPT_TABLES.has(r.table_name));

  if (tables.length === 0) {
    console.error('❌ No tables found in schema "public" — migrations were not applied.');
    process.exit(1);
  }

  const errors = [];

  for (const t of tables) {
    if (!t.rls_enabled) {
      errors.push(`Table "${t.table_name}" does not have ROW LEVEL SECURITY enabled`);
    }
    if (!t.rls_forced) {
      errors.push(`Table "${t.table_name}" does not have FORCE ROW LEVEL SECURITY`);
    }
    if (t.policy_count === 0) {
      errors.push(`Table "${t.table_name}" has RLS enabled but no policies (deny-all)`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ RLS coverage check FAILED with ${errors.length} violation(s):`);
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  const totalPolicies = tables.reduce((sum, t) => sum + t.policy_count, 0);
  console.log(
    `✅ PASS: ${tables.length}/${tables.length} tables have ENABLE + FORCE ROW LEVEL SECURITY ` +
    `and at least one policy (${totalPolicies} policies verified in pg_policies).`
  );
} catch (err) {
  console.error(`❌ RLS coverage check errored: ${err.message}`);
  process.exit(1);
} finally {
  await client.end();
}
