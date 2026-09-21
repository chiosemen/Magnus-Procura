# Magnus Procura — Invariant Register

The ten invariants in `README.md` are the product. They are contractual
commitments to members and enterprise buyers, so each one needs an enforcement
point in code **and** an executable proof that fails when the enforcement is
removed.

This register tracks both. A claim with no proof is listed as unproven, however
confident the surrounding prose is.

**Status legend**
- ✅ **Proven** — executed against a real PostgreSQL instance (or real code) in CI, and confirmed to fail when the control is removed.
- 🟡 **Partial** — exercised, but against an in-memory simulation rather than the deployed path. Real unit value; not proof the product enforces it.
- ❌ **Unproven** — enforced somewhere, but nothing in CI would catch a regression.

The distinction between ✅ and 🟡 is deliberate and load-bearing. A test that
models Postgres in JavaScript passes identically whether or not the migration
was ever applied — this repository has twice shipped a "proof" of that kind.

---

| # | Invariant | Enforcement point | Proof | Status |
|---|---|---|---|---|
| 1 | **Postgres is the product** | `supabase/migrations/*` | All 12 migrations execute in CI via `pnpm db:setup` | 🟡 |
| 2 | **Zero client secrets** | Isolation in `apps/api` | `check-no-client-secrets.mjs` (source only — not built bundles) | ✅ |
| 3 | **100% forced RLS + view isolation** | migrations 006, WS1 | `check-rls-coverage.mjs` — live `pg_class`/`pg_policies`/`reloptions`: 26/26 tables, 5/5 views; `rls-authz.spec.ts` | ✅ |
| 4 | **Clock starts at packet ready** | `packages/policy-engine/src/rules/packet.ts` | `economics-and-invariants.spec.ts` — in-memory | 🟡 |
| 5 | **Named human champions** | `intros.person_id NOT NULL` | `business-invariants.spec.ts` (live) + `check-intro-person-constraint.mjs` | ✅ |
| 6 | **5 primary + 5 bench cap** | `trg_enforce_account_target_limits` — `BEFORE INSERT OR UPDATE` | `business-invariants.spec.ts` (live), incl. the UPDATE-promotion bypass | ✅ |
| 7 | **180-day decline cooldown** | `trg_intro_decline_cooldown` | `business-invariants.spec.ts` (live) — sets cooldown on decline, not on other results | ✅ |
| 8 | **Loaded COGS discipline** | `tick-hours` cron, `unit_econ_run` | `economics-and-invariants.spec.ts` — in-memory | 🟡 |
| 9 | **Capped success fees** | `apps/api/src/routes/attestations.ts` | `attestations.test.ts` (mocked clients) + in-memory | 🟡 |
| 10 | **Keep-90 bounty ledger** | `tick-keep90` cron | `economics-and-invariants.spec.ts` — in-memory | 🟡 |

**Current coverage: 5 proven, 5 partial, 0 unproven.**

---

## Resolved defects

### Invariant 6 — UPDATE bypassed the cap (closed in WS1)

The trigger fired `BEFORE INSERT` only. Inserting 5 primary + 1 bench and then
updating the bench row to primary yielded **6 primary targets**. Reproduced on a
live database during Phase 4 scoping, while the invariant was marked proven —
the test suite only ever exercised INSERT.

Closed by firing on `BEFORE INSERT OR UPDATE` with target identity exclusion.
The regression test is mutation-verified: reverting the trigger to INSERT-only
makes it fail.

### Invariant 3 — all five views bypassed RLS (closed in WS1)

None of the five normative views set `security_invoker`, so each executed as its
owner, a `BYPASSRLS` role. Reproduced on a live database: in one session as one
unprivileged role, `organizations` returned **0 rows** while `member_funnel` and
`unit_econ_run` returned **every tenant**, including cross-tenant unit economics.

Closed by `ALTER VIEW … SET (security_invoker = true)` on all five. The invariant
check now reads `pg_class.reloptions` rather than matching migration text, so a
later `CREATE OR REPLACE VIEW` — which silently resets the option — fails CI.

## Open defects

### Invariant 6 — the cap trigger still has a concurrency race

`trg_enforce_account_target_limits()` runs `SELECT COUNT(*)` then compares. Two
concurrent inserts both observe four rows and both succeed, yielding six. The
tests are sequential, so they pass.

Closing this needs either `pg_advisory_xact_lock` on `org_id` inside the trigger
or a counter column with a `CHECK`. It is a design decision about the write
pattern, so it is tracked rather than guessed at.

### Invariants 4, 8, 9 and 10 — proven only in simulation

`economics-and-invariants.spec.ts` models the rules in JavaScript. It has genuine
value: it pins the 8% / $8,000 arithmetic, the Day-91 bounty schedule and the
COGS ceiling. But it does not execute `apps/api/src/routes/jobs.ts`, the cron
handlers, or the SQL those rules actually run as, so a regression in the deployed
path would not fail it.

Moving these to ✅ means driving the real cron handlers and the real SQL against
the live test database the harness already provides.

---

## Rules for changing this register

1. Adding a table, trigger or constraint that implements an invariant means
   adding its proof in the same pull request.
2. A status may only move toward ✅ on evidence. Moving a row to 🟡 or ❌
   requires saying why in the pull request description.
3. "The test passes" is not evidence a control works. Verify by removing the
   control and confirming the test fails — see `docs/SECURITY-POLICY.md` §4.
4. A simulation of a database is not a database. If the enforcement point is SQL,
   the proof runs SQL.
