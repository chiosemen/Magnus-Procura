#!/usr/bin/env node
/**
 * Invariant Check: RLS coverage on tables AND view security_invoker
 *
 * Queries the live PostgreSQL catalog on a database built by
 * scripts/db/apply-migrations.mjs. It asserts:
 *
 *   Tables (pg_class / pg_policies), for every table in `public`:
 *     1. relrowsecurity      — ENABLE ROW LEVEL SECURITY
 *     2. relforcerowsecurity — FORCE ROW LEVEL SECURITY (owner is not exempt)
 *     3. at least one policy in pg_policies
 *
 *   Views (pg_class.reloptions), for every view in `public`:
 *     4. security_invoker = true
 *
 * Rule 4 exists because a view without security_invoker executes as its OWNER.
 * The migrations' owner holds BYPASSRLS, so such a view returns every tenant's
 * rows to any caller who can select from it, even though the underlying tables
 * have forced RLS. This was confirmed against a live database: the
 * `organizations` table returned 0 rows to an unprivileged role in the same
 * session where `member_funnel` and `unit_econ_run` returned every tenant.
 *
 * Both checks read the catalog rather than pattern-matching migration text.
 * Matching text proves only that a string appears in a file: it cannot detect a
 * statement that failed to apply, was later overridden, or was applied to a
 * view that a subsequent CREATE OR REPLACE reset.
 */

import pg from 'pg';

// Tables that are infrastructure rather than tenant data. Anything not listed
// here is treated as an application table and must carry forced RLS.
const EXEMPT_TABLES = new Set([
  'schema_migrations',
]);

const connectionString = process.env.DATABASE_URL;

console.log('🔒 Running Invariant Check: check-rls-coverage (live catalog: tables + views)...');

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
  const { rows: tableRows } = await client.query(`
    SELECT
      c.relname                        AS table_name,
      c.relrowsecurity                 AS rls_enabled,
      c.relforcerowsecurity            AS rls_forced,
      COALESCE(p.policy_count, 0)::int AS policy_count
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

  // Views and materialized views. reloptions carries security_invoker when set.
  const { rows: viewRows } = await client.query(`
    SELECT
      c.relname AS view_name,
      COALESCE(
        (SELECT option_value
         FROM pg_options_to_table(c.reloptions)
         WHERE option_name = 'security_invoker'),
        'not set'
      ) AS security_invoker
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
    ORDER BY c.relname;
  `);

  const tables = tableRows.filter((r) => !EXEMPT_TABLES.has(r.table_name));

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

  for (const v of viewRows) {
    if (String(v.security_invoker).toLowerCase() !== 'true') {
      errors.push(
        `View "${v.view_name}" has security_invoker=${v.security_invoker} — ` +
        `it executes as its owner and bypasses RLS on the underlying tables (cross-tenant leak)`
      );
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
  console.log(
    `✅ PASS: ${viewRows.length}/${viewRows.length} views enforce security_invoker = true ` +
    `(verified in pg_class.reloptions, not migration text).`
  );
} catch (err) {
  console.error(`❌ RLS coverage check errored: ${err.message}`);
  process.exit(1);
} finally {
  await client.end();
}
