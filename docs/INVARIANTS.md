# Magnus Procura — Core Invariants Ledger

This document tracks the verification status of Magnus Procura's 10 core architectural invariants. Invariants are only considered "PROVEN" when backed by automated, reproducible execution suites (migration triggers, invariant scripts, or end-to-end integration tests).

---

## Invariant Scorecard

| # | Invariant | Enforcement Mechanism | Verification Suite | Status |
|---|---|---|---|---|
| **1** | Postgres is the Product | Canonical Postgres tables & SQL views | `packages/db/tests/schema.test.ts` | 🟡 Active |
| **2** | Zero Client Secrets | Secret isolation; client bundle scanner | `scripts/invariants/check-no-client-secrets.mjs` | 🟢 **PROVEN** |
| **3** | 100% Forced RLS & View Isolation | `ENABLE` + `FORCE RLS` on 26 tables; `security_invoker = true` on 5 views | `scripts/invariants/check-rls-coverage.mjs`, `packages/db/tests/tenant-isolation.spec.ts` | 🟢 **PROVEN** |
| **4** | Clock Starts at Packet Ready | Gated intro dispatch & SLA clocks | `packages/policy-engine/src/rules/packet.ts` | 🟡 In Progress (WS3) |
| **5** | Named Human Champions | `intros.person_id NOT NULL` foreign key | `scripts/invariants/check-intro-person-constraint.mjs` | 🟢 **PROVEN** |
| **6** | 5+5 Target Account Limit | `trg_enforce_account_target_limits` on `INSERT OR UPDATE` | `packages/db/tests/tenant-isolation.spec.ts` | 🟢 **PROVEN (WS1)** |
| **7** | 180-Day Decline Cooldown | Re-approach cooldown constraint | `packages/db/src/schema/intros.ts` | ⚪ Pending (WS4) |
| **8** | Loaded COGS Discipline | 15 members/operator; 15 hrs/yr at \$120/hr cap | `public.unit_econ_run` view | ⚪ Pending (WS4) |
| **9** | Capped Success Fees | 8% fee capped at \$8,000 on Net 15 | `apps/api/src/routes/attestations.ts` | ⚪ Pending (WS4) |
| **10** | Keep-90 Bounty Ledger | \$500 referral bounty on Day 91 post-keep | `apps/api/src/routes/jobs.ts` | ⚪ Pending (WS4) |

> [!NOTE]
> **Invariant 6 Verification Audit (Phase 4 WS1)**:
> Invariant 6 was previously marked as proven, but was identified during the independent Codex and Claude Phase 4 scoping review as vulnerable to an `UPDATE` bypass (the database trigger originally fired only `BEFORE INSERT`, allowing an attacker to insert 5 primary + 1 bench target and update the bench row to primary, yielding 6 primary targets).
> The proven invariant baseline was accordingly dropped to **4 proven invariants** prior to remediation. With WS1, the trigger has been hardened to `BEFORE INSERT OR UPDATE` on `public.account_targets` with target identity exclusion (`id != NEW.id`), and verified against the UPDATE exploit in `packages/db/tests/tenant-isolation.spec.ts`.

---

## Detailed Invariant Profiles

### Invariant 1: Postgres is the Product
- **Rule**: State does not live in ephemeral workers or in-memory caches. Every introduction, SLA clock, stage transition, and attestation is stored in Postgres tables and SQL views.
- **Verification**: Schema definitions in `packages/db/src/schema` and migrations in `supabase/migrations`.

### Invariant 2: Zero Client Secrets
- **Rule**: Service role keys, Stripe secret keys, Resend API keys, and cron secret tokens must never appear in `apps/web` or browser client bundles.
- **Verification**: Automated scanner `scripts/invariants/check-no-client-secrets.mjs` executes on every build and CI run.

### Invariant 3: 100% Forced RLS & View Security Invoker
- **Rule**: All 26 public tables have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. All 5 normative SQL views (`member_funnel`, `programs_sla`, `cohort_card`, `partner_scorecard`, `unit_econ_run`) enforce `security_invoker = true`.
- **Verification**: `scripts/invariants/check-rls-coverage.mjs` and `packages/db/tests/tenant-isolation.spec.ts`.

### Invariant 4: Clock Starts at Packet Ready
- **Rule**: Introductions cannot be drafted or sent while "The File" packet is in a `blocked` status.
- **Verification**: Policy engine packet rule (`packages/policy-engine/src/rules/packet.ts`) and WS3 customer journey integration.

### Invariant 5: Named Human Champions
- **Rule**: Every introduction strictly requires a named human champion (`intros.person_id NOT NULL`). Events cannot be promoted to introductions without a human champion.
- **Verification**: Schema constraint verified by `scripts/invariants/check-intro-person-constraint.mjs`.

### Invariant 6: 5+5 Target Account Limit
- **Rule**: An organization may never have more than 5 primary and 5 bench targets concurrently.
- **Vulnerability Closed**: Hardened trigger `trg_enforce_account_target_limits` to fire `BEFORE INSERT OR UPDATE`. Mutation tests in `packages/db/tests/tenant-isolation.spec.ts` prove that attempting to update a bench target to primary when 5 primary targets exist is rejected.

### Invariant 7: 180-Day Decline Cooldown
- **Rule**: If an enterprise buyer declines an introduction, a 180-day cooldown must elapse before any re-approach can be initiated.

### Invariant 8: Loaded COGS Discipline
- **Rule**: Operators manage a maximum of 15 members; loaded operator COGS must not exceed 15 annual hours per member at \$120/hour (\$1,800 cap on a \$4,800 contract).

### Invariant 9: Capped Success Fees
- **Rule**: Success fees on resulting purchase orders are fixed at 8% of the initial subcontract value, strictly capped at \$8,000 on Net 15 terms.

### Invariant 10: Keep-90 Bounty Ledger
- **Rule**: Partner referral bounties (\$500) are paid out only after the 90-day retention period without a refund.
