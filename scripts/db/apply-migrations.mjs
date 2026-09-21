#!/usr/bin/env node
/**
 * Applies the Supabase compatibility shim and every production migration to a
 * real PostgreSQL database.
 *
 * This exists so that migrations are *executed*, not merely text-matched. Every
 * database invariant check and RLS authorization test in this repository runs
 * against a database built by this script.
 *
 * Migrations are applied as `magnus_owner` (NOSUPERUSER + BYPASSRLS), which
 * mirrors Supabase's `postgres` role. Applying them as a superuser would let
 * RLS recursion defects pass unnoticed, because superusers bypass FORCE ROW
 * LEVEL SECURITY unconditionally.
 *
 * Usage: DATABASE_URL=postgresql://... node scripts/db/apply-migrations.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const migrationsDir = path.join(rootDir, 'supabase/migrations');
const bootstrapFile = path.join(rootDir, 'supabase/test/bootstrap.sql');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is required.');
  process.exit(1);
}

/** Applies one SQL file in a transaction, so a failure leaves no partial schema. */
async function applyFile(client, filePath, { asOwner }) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query('BEGIN');
  try {
    if (asOwner) {
      await client.query('SET LOCAL ROLE magnus_owner');
    }
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('🗄️  Applying database schema to a real PostgreSQL instance...\n');

  try {
    // The shim needs superuser rights (CREATE EXTENSION, CREATE ROLE).
    await applyFile(client, bootstrapFile, { asOwner: false });
    console.log(`   ${path.basename(bootstrapFile).padEnd(52)} ok  (supabase shim)`);

    const migrations = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (migrations.length === 0) {
      console.error('❌ No migrations found — refusing to report success.');
      process.exit(1);
    }

    for (const file of migrations) {
      await applyFile(client, path.join(migrationsDir, file), { asOwner: true });
      console.log(`   ${file.padEnd(52)} ok`);
    }

    console.log(`\n✅ ${migrations.length} migrations applied and executed successfully.`);
  } catch (err) {
    console.error(`\n❌ Migration failed: ${err.message}`);
    if (err.position) console.error(`   at character position ${err.position}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
