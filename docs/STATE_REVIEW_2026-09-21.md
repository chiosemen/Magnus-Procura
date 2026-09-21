# Magnus Procura - current-state review

Date: September 21, 2026
Reviewer: Codex
Scope: independent comparison of the attached Antigravity work history with the current local repository and exact-head GitHub CI. This is a project-state review with targeted code findings, not an exhaustive penetration test or live production certification.

## Assessment

Magnus Procura has a coherent business model, a substantial backend/schema implementation, and a broad frontend. Antigravity's migration away from the original client-only prototype is real. The latest security commit and green CI are also real. However, the user-facing workflows and production assurance lag behind the narrative: major screens remain fixtures, some interactions cannot authenticate to their API, and serious authorization/data-isolation questions remain in the source.

I would not authorize real customer onboarding, sensitive packet uploads, or live billing based on the evidence reviewed. That is a readiness judgment from specific gaps below, not a claim that a live system was exploited.

## Evidence and validation

- Reviewed commit: `7d1068e48712ec49239f428ed6caacf8dc9b13db` on main.
- [Verified CI run](https://github.com/chiosemen/Magnus-Procura/actions/runs/35640210283): successful typecheck, tests, static invariants, and build for that exact SHA.
- Local scratch-copy commands used installed pnpm 10.15.1 and existing dependencies. No real .env input or inherited credentials; OS sandbox denied network and original-repository writes. No source files were changed for tests.

| Command | Exit | What it establishes |
|---|---:|---|
| `pnpm test` | 0 | 37 API and 12 DB tests pass; three static invariant checks pass |
| `pnpm typecheck` | 0 | Current checked code passes TypeScript validation |
| `node scripts/deploy/attest-live-services.mjs` | 0 | Script reports ready even with no credentials/network; false-positive readiness demonstrated |
| `STRICT_ENV_CHECK=true node scripts/deploy/verify-env.mjs` | 1 | Missing required environment correctly rejected |

Build success is supported by the verified hosted CI run; no fresh local production build or deployed bundle examination was performed. Initial package-manager bootstrap stalled in the restricted environment; the successful checks used the cached pinned pnpm executable. No dependency installation was performed.

## What is genuinely present

Next.js/React frontend; Hono API; eight migration files; schemas for programs, readiness packets, targets, named champions, introductions, attestations, partners, bounties, invoices, operators, cohorts, audit records and the do-not-serve register. Backend routes cover billing, webhooks, exports, intros, attestations, targets, fit and jobs. The worker has an interruptible sleep. Current cron checks reject missing secrets outside test mode. CSP/security headers and public-checkout rate limiting have been added. Public blacklist notes and IDs are removed, although actual reason codes remain.

## Findings and recommended acceptance checks

### 1. Critical priority: internal-staff authority comes from user-controlled data

`handle_new_user()` copies `NEW.raw_user_meta_data->>'is_internal'` into the new public profile. API authentication reads `profiles.is_internal`; its role helpers grant bypasses when true. The profile self-update policy authorizes updates to the caller's row without a column restriction for this privileged flag. No compensating column-grant restrictions or protective trigger was found in the reviewed migrations.

A new account whose supplied metadata includes the staff flag can therefore be assigned authority by the schema as written. A self-update route is also a concern if deployed grants permit UPDATE. Actual signup policy, migration application and grants remain unverified; no live account was created.

Evidence: [supabase/migrations/20260916000001_core_schema.sql:100](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/supabase/migrations/20260916000001_core_schema.sql#L100); [supabase/migrations/20260916000006_row_level_security.sql:106](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/supabase/migrations/20260916000006_row_level_security.sql#L106); [apps/api/src/lib/auth.ts:56](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/api/src/lib/auth.ts#L56).

Acceptance: staff authority must be provisioned through a trusted server-controlled path, impossible to set through signup/user profile updates. Test an ordinary user attempting privilege changes against a real isolated database and production-mode authorization middleware. Supabase explicitly warns against user metadata for authorization: https://supabase.com/docs/guides/database/postgres/row-level-security.

### 2. High priority: operator status is not organization-specific authorization

`requireOperatorOrAdmin` allows a user with any active operator assignment. Targets routes then use the privileged Supabase client to list or rotate targets identified by caller-supplied org/target IDs. They ensure the outgoing and incoming targets belong to the same organization, but do not verify that the caller is assigned to that organization. This is a source-visible cross-organization access/mutation path if normal operators use the route and no external compensating guard exists.

Evidence: [apps/api/src/lib/auth.ts:135](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/api/src/lib/auth.ts#L135); [apps/api/src/routes/targets.ts:8](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/api/src/routes/targets.ts#L8).

Acceptance: operator A assigned only to org A must receive a denial when reading or rotating org B targets. Derive authorization from the fetched resource, not merely from a global operator flag. Apply the same review to all service-role-backed routes.

### 3. High priority: delivered UI is not an integrated customer journey

The public fit form only updates React state on submit. The claimed do-not-serve check is a substring heuristic on names/domains; the operator check waits 450ms and uses the same kind of heuristic. Neither calls the implemented blacklist API. An innocent domain containing "bad" can be marked ineligible, while a real database-listed entity without those substrings passes this UI check. Other operator/member actions similarly modify local state.

Billing portal and packet ZIP buttons use a fixed organization UUID and omit Authorization, while their backend routes require Bearer authentication. Signing in via Supabase alone does not add that header to these fetch calls.

Evidence: [apps/web/src/app/apply/page.tsx:23](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/apply/page.tsx#L23); [apps/web/src/app/(operator)/ops/orgs/[id]/page.tsx:58](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/(operator)/ops/orgs/[id]/page.tsx#L58); [apps/web/src/app/(member)/billing/page.tsx:18](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/(member)/billing/page.tsx#L18); [apps/web/src/app/(member)/packet/page.tsx:102](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/(member)/packet/page.tsx#L102).

Acceptance: a real authenticated test organization completes intake, packet upload/review, target selection, copy approval and export; persistence survives refresh and is isolated from another organization. Use actual register records rather than keyword simulations.

### 4. High priority: route protection misclassifies public intake and misses other portals

`pathname.startsWith('/app')` also matches `/apply`. With Supabase configured, unauthenticated intake visitors are redirected to login. Meanwhile `/packet`, `/targets`, `/intros`, `/scoreboard`, `/billing` and `/partner/*` do not match the listed prefixes. Any logged-in user also passes the web middleware's admin/operator path check; layouts reviewed do not add a server-side role check. When public Supabase variables are missing, the middleware skips protection entirely. Backend authorization can still deny API requests, so shell exposure alone is not proof of customer-data exfiltration.

Evidence: [apps/web/src/middleware.ts:15](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/middleware.ts#L15).

Acceptance: exact public/member/operator/partner/admin route matrix tested with anonymous users and every role, including missing configuration. `/apply` stays public; protected groups fail closed and enforce role.

### 5. High priority: production attestation is a configuration checklist with an unjustified verdict

The attestation reads local file names/text and environment value formats. It does not query deployed migrations, Railway service health, Stripe deliveries or DNS. It prints literal DKIM/SPF/DMARC/MX checkmarks. With absent credentials and network denied, the fresh check returned 4 passed, 3 warnings, 0 failures and a production-ready message.

The strict environment checker now correctly returns 1 when values are missing, but the reviewed CI and start scripts do not wire it as a required production gate. A standalone correct validator is not an enforced deployment control.

Evidence: [scripts/deploy/attest-live-services.mjs:137](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/scripts/deploy/attest-live-services.mjs#L137); `.github/workflows/ci.yml`; `scripts/deploy/verify-env.mjs`; `infra/railway.toml`.

Acceptance: distinguish static preflight, staging rehearsal and production verification. Missing runtime evidence must produce unverified/blocked, not attested. Operator supplies specific non-secret evidence for service readiness, migration state, webhook processing and actual DNS verification. No credential requests are needed for this review.

### 6. High priority: public metrics and internal audit feeds are hard-coded

Landing copy labels 79%, 54%, 33% and 19% as aggregate cohort conversion stages and mentions an n >= 10 threshold, but the page contains literal values without a data read. The admin executive page labels a local array as a real-time audit stream. These are not operational evidence. Landing claims that vendor-code mapping guarantees portal registration also need substantiation and qualification before publication.

Evidence: [apps/web/src/app/page.tsx:428](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/page.tsx#L428); [apps/web/src/app/(admin)/admin/page.tsx:28](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/apps/web/src/app/(admin)/admin/page.tsx#L28).

Acceptance: label demonstration values unmistakably, or replace with empty states and verified scoped queries. Only publish eligible cohort metrics with their provenance and observation period. No independent legal or procurement standard assessment was performed.

### 7. Medium/high priority: passing tests and invariants have limited reach

API tests mock service clients and use NODE_ENV=test auth bypasses. The synthetic lifecycle test defines its own in-memory functions instead of exercising production SQL or browser flows. The RLS invariant matches text for ENABLE/FORCE/policies; it does not test policy correctness or applied grants. The secret scanner searches `apps/web/src`; it does not inspect generated bundles. The web package has no test script.

Evidence: [packages/db/tests/synthetic-lifecycle.test.ts:4](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/packages/db/tests/synthetic-lifecycle.test.ts#L4); `apps/api/src/routes/fit.test.ts`; `apps/api/src/lib/auth.ts`; [scripts/invariants/check-rls-coverage.mjs](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/scripts/invariants/check-rls-coverage.mjs); [scripts/invariants/check-no-client-secrets.mjs:20](https://github.com/chiosemen/Magnus-Procura/blob/7d1068e48712ec49239f428ed6caacf8dc9b13db/scripts/invariants/check-no-client-secrets.mjs#L20); `apps/web/package.json`.

Acceptance: isolated database migration/role tests, real production-mode negative authorization tests and browser acceptance tests. A bundled-secret scan must inspect actual build outputs. Keep the existing tests, but describe them accurately.

### 8. Medium priority: residual hardening and operational integrity

- Public blacklist response still returns actual `match.reason`; earlier plans proposed generic `ineligible`. Decide which disclosure is intended instead of marking the plan fully complete.
- CSP exists but permits unsafe-inline, unsafe-eval and broad connection destinations; describe it as partial hardening rather than strict script containment.
- Root manifest has top-level npm-style `overrides`; the lock still contains PostCSS 8.4.31 and Drizzle 0.39.3. This does not establish that the desired dependency remediation took effect. Validate resolved versions and current advisory applicability; this review does not repeat unverified CVE severity claims from the PDF.
- Target rotation performs separate mutations; a failure can leave only half the rotation applied. The cap trigger runs before INSERT only, not UPDATE, and needs concurrency validation.
- `kept90_count` checks `NOW() > refund_until`, which is not proof of 90 retained days. `unit_econ_run` joins several one-to-many tables before summing, creating a multiplication risk when invoices, bounties and hours coexist. Validate with representative multi-row cases.
- Public SQL views omit explicit security_invoker settings; inspect deployed grants/view execution semantics before assuming table RLS protects every view.

Evidence: `apps/api/src/routes/fit.ts:69`; `apps/web/next.config.ts`; `package.json`; `pnpm-lock.yaml`; `packages/db/package.json`; `apps/api/src/routes/targets.ts:111`; `supabase/migrations/20260916000002_the_file_schema.sql:118`; `supabase/migrations/20260916000005_normative_views.sql:15,93`.

## Recommended next work, in order

1. **Identity and tenant isolation:** close privileged profile fields and organization-scope gaps, with negative tests against an isolated database.
2. **One real customer journey:** fix route/session boundaries and connect intake -> packet -> targets -> approval -> intro -> reporting, removing fixed IDs and simulated success states.
3. **Truthful reporting and reliable economics:** replace fixture claims, make target rotation atomic, and validate SLA/Keep-90/financial aggregate rules.
4. **Enforced release evidence:** run migrations and browser acceptance tests in isolated staging; wire strict gates; require actual runtime evidence before a live launch recommendation.

These are proposed work packages, not executed fixes. Original application code, lockfile, deployment settings and production state were unchanged. This review adds only durable context documentation and portable handoff files.

## Evidence boundaries

The historical PDF has repeated old/new sections, stale table counts and internally inconsistent finding totals. Its numeric readiness scores are not independently validated. No production environment, live database grants, actual payment/email execution, deployed bundle, or browser session was validated. The attached material references PRD/architecture sections whose full canonical standalone documents were not located in the tracked repository. Resolve those specifications before treating all commercial rules as settled.
