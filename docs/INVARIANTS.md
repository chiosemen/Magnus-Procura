# Magnus Procura — Invariant Register

The ten invariants in `README.md` are the product. They are contractual
commitments to members and enterprise buyers, so each one needs an enforcement
point in code **and** an executable proof that fails when the enforcement is
removed.

This register tracks both. A claim with no proof is listed as unproven, however
confident the surrounding prose is.

**Status legend**
- ✅ **Proven** — executed against real PostgreSQL or real code in CI; fails if the control is removed.
- 🟡 **Partial** — exercised, but against a mock, a fabricated schema, or only on the happy path.
- ❌ **Unproven** — enforced somewhere, but nothing in CI would catch a regression.

---

| # | Invariant | Enforcement point | Proof | Status |
|---|---|---|---|---|
| 1 | **Postgres is the product** — every intro, clock, transition and attestation lives in tables and views | `supabase/migrations/*` | Architectural; all 10 migrations now execute in CI via `pnpm db:setup` | 🟡 |
| 2 | **Zero client secrets** | Isolation in `apps/api` | `scripts/invariants/check-no-client-secrets.mjs` | ✅ |
| 3 | **100% forced RLS** on every table | `20260916000006_row_level_security.sql` | `scripts/invariants/check-rls-coverage.mjs` — live `pg_policies` query, 26/26 tables, 38 policies | ✅ |
| 4 | **Clock starts at packet ready** — no intro drafted or sent while the packet is `blocked` | `packetRule` + API guards | None | ❌ |
| 5 | **Named human champions** — `intros.person_id NOT NULL` | Column constraint | `business-invariants.spec.ts` + `check-intro-person-constraint.mjs` | ✅ |
| 6 | **5 primary + 5 bench target limit** | `trg_enforce_account_target_limits` | `business-invariants.spec.ts` — 5 tests incl. per-tier and per-org scoping | ✅ |
| 7 | **180-day decline cooldown** | `trg_intro_decline_cooldown` | `business-invariants.spec.ts` — sets cooldown on decline, not on other results | ✅ |
| 8 | **Loaded COGS discipline** — 15 members/operator, 15h/member/yr | `tick-hours` cron | None | ❌ |
| 9 | **Capped success fees** — 8% of first PO, capped at $8,000, Net 15 | Attestation acceptance | Mock only (`synthetic-lifecycle.test.ts`) | 🟡 |
| 10 | **Keep-90 bounty ledger** — $500 paid Day 91, no refund | `tick-keep90` cron | Mock only (`synthetic-lifecycle.test.ts`) | 🟡 |

**Current coverage: 5 proven, 3 partial, 2 unproven.**

---

## Known defects in enforcement

### Invariant 6 — the target limit trigger has a concurrency race

`public.trg_enforce_account_target_limits()` is a `BEFORE INSERT` trigger that
runs `SELECT COUNT(*)` and then compares. Two concurrent inserts both observe
four existing rows and both succeed, yielding six targets.

The current tests are sequential, so they pass. Closing this needs either a
`pg_advisory_xact_lock` on `org_id` inside the trigger, or a counter column with
a `CHECK` constraint. Tracked, not yet fixed — it requires a design decision
about which approach fits the write pattern.

### Invariant 9 and 10 — proven only against a hand-written mock

`synthetic-lifecycle.test.ts` operates on an in-memory `MockState` interface. It
verifies the arithmetic of the fee cap and the bounty schedule, but it does not
execute the SQL or the cron handlers that implement them in production. A
regression in `apps/api/src/routes/jobs.ts` would not fail this suite.

### Invariant 4 and 8 — no proof at all

Both are enforced in application code with no test asserting the negative case
(that a blocked packet *cannot* produce a sent intro; that an over-budget
operator *is* flagged).

---

## Rules for changing this register

1. Adding a table, trigger or constraint that implements an invariant means
   adding its proof in the same pull request.
2. A status may only move toward ✅. Moving a row to 🟡 or ❌ requires saying why
   in the pull request description.
3. "The test passes" is not evidence a control works. Verify by removing the
   control and confirming the test fails — see `docs/SECURITY-POLICY.md` §4.
