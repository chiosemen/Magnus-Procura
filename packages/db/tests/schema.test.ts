import { describe, it, expect } from 'vitest';
import * as schema from '../src/schema';
import fs from 'fs';
import path from 'path';

describe('Database Schema & Migration Integrity', () => {
  it('exports all 24 schema tables and views matching Tech Architecture §6', () => {
    // 6.1 Core
    expect(schema.profiles).toBeDefined();
    expect(schema.organizations).toBeDefined();
    expect(schema.orgMembers).toBeDefined();
    expect(schema.programs).toBeDefined();
    expect(schema.fitReviews).toBeDefined();

    // 6.2 The File
    expect(schema.packets).toBeDefined();
    expect(schema.artifacts).toBeDefined();
    expect(schema.accountTargets).toBeDefined();
    expect(schema.people).toBeDefined();

    // 6.3 Factory
    expect(schema.intros).toBeDefined();
    expect(schema.stageTransitions).toBeDefined();
    expect(schema.opportunities).toBeDefined();
    expect(schema.attestations).toBeDefined();
    expect(schema.events).toBeDefined();

    // 6.4 Partners, Money & Ops
    expect(schema.partners).toBeDefined();
    expect(schema.referrals).toBeDefined();
    expect(schema.bounties).toBeDefined();
    expect(schema.invoices).toBeDefined();
    expect(schema.operatorAssignments).toBeDefined();
    expect(schema.operatorHours).toBeDefined();
    expect(schema.cohorts).toBeDefined();
    expect(schema.cohortMembers).toBeDefined();
    expect(schema.scoreSnapshots).toBeDefined();
    expect(schema.auditLog).toBeDefined();
    expect(schema.doNotServe).toBeDefined();
  });

  it('contains all 10 numbered SQL migration files in sequence', () => {
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir).sort();
    expect(files.length).toBe(10);

    expect(files[0]).toMatch(/000001_core_schema\.sql$/);
    expect(files[1]).toMatch(/000002_the_file_schema\.sql$/);
    expect(files[2]).toMatch(/000003_factory_schema\.sql$/);
    expect(files[3]).toMatch(/000004_partners_money_ops\.sql$/);
    expect(files[4]).toMatch(/000005_normative_views\.sql$/);
    expect(files[5]).toMatch(/000006_row_level_security\.sql$/);
    expect(files[6]).toMatch(/000007_stripe_idempotency\.sql$/);
    expect(files[7]).toMatch(/000001_do_not_serve\.sql$/);
    expect(files[8]).toMatch(/000001_secure_internal_flag\.sql$/);
    expect(files[9]).toMatch(/000002_ws1_tenant_isolation_and_target_limits\.sql$/);

    // Verify each migration contains non-trivial content
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toMatch(/CREATE|ALTER/);
    }
  });

  it('migration 005 contains normative views matching PRD definitions', () => {
    const migration005 = fs.readFileSync(
      path.resolve(__dirname, '../../../supabase/migrations/20260916000005_normative_views.sql'),
      'utf8'
    );
    expect(migration005).toContain('CREATE OR REPLACE VIEW public.member_funnel');
    expect(migration005).toContain('CREATE OR REPLACE VIEW public.programs_sla');
    expect(migration005).toContain('CREATE OR REPLACE VIEW public.cohort_card');
    expect(migration005).toContain('CREATE OR REPLACE VIEW public.partner_scorecard');
    expect(migration005).toContain('CREATE OR REPLACE VIEW public.unit_econ_run');
  });

  it('migration 006 enforces RLS on all public tables', () => {
    const migration006 = fs.readFileSync(
      path.resolve(__dirname, '../../../supabase/migrations/20260916000006_row_level_security.sql'),
      'utf8'
    );
    expect(migration006).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration006).toContain('is_admin()');
    expect(migration006).toContain('is_assigned_operator');
    expect(migration006).toContain('has_org_role');
  });

  it('migration 010 (WS1) enforces security_invoker on all 5 views and hardens target limits trigger', () => {
    const migration010 = fs.readFileSync(
      path.resolve(__dirname, '../../../supabase/migrations/20260921000002_ws1_tenant_isolation_and_target_limits.sql'),
      'utf8'
    );
    expect(migration010).toContain('ALTER VIEW public.member_funnel SET (security_invoker = true);');
    expect(migration010).toContain('ALTER VIEW public.programs_sla SET (security_invoker = true);');
    expect(migration010).toContain('ALTER VIEW public.cohort_card SET (security_invoker = true);');
    expect(migration010).toContain('ALTER VIEW public.partner_scorecard SET (security_invoker = true);');
    expect(migration010).toContain('ALTER VIEW public.unit_econ_run SET (security_invoker = true);');
    expect(migration010).toContain('BEFORE INSERT OR UPDATE ON public.account_targets');
  });
});
