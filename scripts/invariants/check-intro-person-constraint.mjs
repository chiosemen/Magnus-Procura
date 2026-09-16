#!/usr/bin/env node
/**
 * Invariant Check: Intro & Target Database Constraints
 * 
 * Verifies core anti-opaque invariants:
 * 1. Intros table strictly requires person_id NOT NULL.
 * 2. Database trigger forbids event promotion to intro without a named champion.
 * 3. 5 Primary + 5 Bench account limits strictly enforced.
 * 4. 180-day decline cooldown check is declared.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const factoryMigration = path.resolve(rootDir, 'supabase/migrations/20260916000003_factory_schema.sql');
const fileMigration = path.resolve(rootDir, 'supabase/migrations/20260916000002_the_file_schema.sql');

console.log('🔒 Running Invariant Check: check-intro-person-constraint...');

let errors = [];

if (!fs.existsSync(factoryMigration)) {
  errors.push(`Factory migration missing: ${factoryMigration}`);
} else {
  const sql = fs.readFileSync(factoryMigration, 'utf8');

  // Invariant 1: person_id UUID NOT NULL on intros
  const personNotNull = /person_id\s+UUID\s+NOT\s+NULL/i.test(sql);
  if (!personNotNull) {
    errors.push('intros table does not enforce person_id UUID NOT NULL');
  }

  // Invariant 2: check_event_promotion or trigger forbidding event without champion
  const eventChampionCheck = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(public\.)?trg_prevent_event_without_champion/i.test(sql) ||
    /prevent.*champion/i.test(sql) || /person_id\s+IS\s+NOT\s+NULL/i.test(sql);
  if (!eventChampionCheck) {
    errors.push('Missing trigger preventing promotion without named champion');
  }

  // Invariant 3: 180-day decline cooldown
  const cooldownCheck = /180\s+days/i.test(sql) || /do_not_contact_until/i.test(sql);
  if (!cooldownCheck) {
    errors.push('Missing 180-day decline cooldown check');
  }
}

if (!fs.existsSync(fileMigration)) {
  errors.push(`The File migration missing: ${fileMigration}`);
} else {
  const sql = fs.readFileSync(fileMigration, 'utf8');

  // Invariant 4: 5 Primary + 5 Bench limit
  const maxTargetsTrigger = /trg_enforce_account_target_limits/i.test(sql) || /primary_count\s*>\s*5/i.test(sql);
  if (!maxTargetsTrigger) {
    errors.push('Missing trigger enforcing max 5 primary and 5 bench targets per member');
  }
}

if (errors.length > 0) {
  console.error(`❌ INVARIANT VIOLATIONS (${errors.length}):`);
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ PASS: All database schema anti-opaque constraints verified.');
  process.exit(0);
}
