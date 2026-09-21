# Magnus Procura - durable project context

Last reviewed: September 21, 2026. This is a dated reference, not a claim about future code or deployment status.

## Identity and purpose

Magnus Procura is Magnus's anti-opaque enterprise sourcing and supplier-readiness platform, developed with Antigravity. It connects established B2B suppliers with enterprise buyers through verified readiness packets ("The File"), named human buyer champions, member-approved introductions, and accountable service delivery clocks. Transparency, evidence, and measurable conversion are central to the business.

Keep this project separate from Magnus Findr / ResellerFinder (marketplace resale discovery), Magnus Sales OS, and nonprofit compliance consulting. Shared Magnus ownership does not make their data models, delivery claims, credentials, or deployment state interchangeable.

- Local repository: `/Users/chinyeosemene/dev/Magnus-Procura`
- GitHub repository: https://github.com/chiosemen/Magnus-Procura
- Reviewed branch: `main`
- Reviewed commit: `7d1068e48712ec49239f428ed6caacf8dc9b13db`
- Last reviewed change: `fix(security): remediate production hardening deep audit findings`
- Context source: the user-supplied 107-page "Magnus Procura-Antigravity SOW.pdf", repository source, and verified GitHub CI. The PDF compiles conversations, implementation plans, audits, and walkthroughs; it is not a clean, single current acceptance specification. Earlier prototype findings must not be treated as the latest state.

## Business model and intended rules

These are documented product commitments in README, landing copy, schemas, and tests. Their presence in documents does not prove complete implementation or legally executed terms.

| Area | Intended model |
|---|---|
| Customer | Established B2B suppliers pursuing enterprise procurement relationships |
| Intake | Fit assessment, documented fit decision, conflict/do-not-serve screening; UI pass threshold 70 |
| The File | Verified capability and procurement-readiness evidence before outreach; schema/test/UI artifact definitions still need reconciliation |
| Target accounts | Maximum 5 primary plus 5 bench targets; rotate exhausted/dead targets with an accountable reason |
| Introductions | Named human champion, member-approved copy, ready packet; events alone do not count |
| 90-day program | Landing price $3,600; 4 target introductions/attempts under the program SLA |
| Annual program | Landing price $4,800 annually, or $400/month; 8 target introductions/attempts |
| Success fee | 8% of first resulting PO/subcontract, capped at $8,000, Net 15 |
| Refund | Landing FAQ says 30 days or earlier acceptance of two qualified introductions; reconcile with billing/program behavior before use |
| Cadence | Day 30/60/90 reviews, copy-approval reminders, unresponsive-account pauses |
| Decline cooldown | 180 days before re-approach |
| Partner economics | $500 referral bounty due on Day 91 subject to Keep-90/no-refund conditions |
| Delivery economics | Maximum 15 members per operator; 15 annual hours/member at $120/hour = $1,800 loaded labor budget |
| Public proof | Real cohort metrics, publication threshold n >= 10; never present fixtures as operational evidence |

No guarantee of winning a purchase order follows from a contracted introduction-attempt commitment.

## Architecture and roles

The current implementation is a pnpm monorepo, no longer the old root Vite prototype.

- `apps/web`: Next.js 15, React 19, TypeScript, Tailwind, Supabase SSR helpers; 22 page files across Public, Member, Operator, Partner, and Admin surfaces.
- `apps/api`: Hono/Node API, Supabase service client, Stripe billing/webhooks, Resend email, packet exports, intro dispatch, attestations, blacklist and target routes, SLA/QBR jobs.
- `apps/api/src/jobs/worker.ts`: background cadence worker.
- `packages/db`: Drizzle/Postgres schemas and shared types.
- `supabase/migrations`: eight SQL migrations, including do-not-serve and exhausted target status; invariant scanner expects 26 tables.
- `infra`: proposed Railway web/api/worker configuration and cron schedule files. Configuration is not deployment proof.
- `.github/workflows/ci.yml`: typecheck, API/DB tests, static invariants, and production build.

The database is intended to be the source of truth. Much of the web application does not yet consume it.

## Verified current state

- The reviewed checkout was clean before this documentation was added.
- GitHub run https://github.com/chiosemen/Magnus-Procura/actions/runs/35640210283 succeeded at the exact reviewed commit, including build.
- Fresh isolated local `pnpm test`: 49 passed tests (37 API + 12 DB), plus three passing static invariant scripts.
- Fresh isolated `pnpm typecheck`: exit 0.
- Strict environment validation with no configured secrets: exit 1, as expected.
- The deployment attestation script also ran without credentials and with network denied: 4 passed, 3 warnings, 0 failures, exit 0, and a production-ready message. This demonstrates a misleading readiness gate, not a successful deployment.
- No production database, live credentials, paid API calls, customer communications, payment operations, or deployments were used in this review.

## Critical qualifications to carry forward

1. **Authorization risk:** the auth-to-profile trigger accepts `is_internal` from user metadata. The API trusts that profile flag for staff bypasses. A self-profile UPDATE policy also lacks explicit column protection for the flag. Source-level blocker; deployed grants/signup settings were not inspected.
2. **Tenant scope risk:** target routes use a guard proving operator status somewhere, then service-role queries against arbitrary target organizations without a target-specific assignment check.
3. **Incomplete product wiring:** intake and blacklist UI use local logic; many dashboards and actions are fixtures/local state. Billing portal and packet export requests have hard-coded org IDs and lack the Bearer header expected by the API.
4. **Route matching defect:** `/apply` matches `startsWith('/app')`, so the public intake path is gated when Supabase is configured. Other member and partner paths are omitted; web guard checks login, not role.
5. **Evidence overclaims:** static RLS/source scanners and in-memory lifecycle tests do not prove database isolation or a live customer journey. There is no web test script.
6. **Marketing truth:** landing conversion percentages and supposed real-time admin audit data are hard-coded; retain them only as explicitly labeled demo data until replaced with verified evidence.
7. **Hardening is not complete:** dependency lockfile still includes Drizzle 0.39.3 and PostCSS 8.4.31; CSP permits unsafe-inline/unsafe-eval; public blacklist responses still disclose actual reason codes.
8. **Data integrity needs validation:** target rotation uses separate mutations, target-cap trigger is insert-only, SQL Keep-90 counts use refund expiry, and aggregate financial joins may multiply sums.

Assessment: a substantial implementation with green CI, but a partially integrated product with launch-blocking authorization and evidence gaps. Do not repeat "fully production-ready", "100% secure", "live verified", or numerical readiness scores as established facts.

## How to continue

Read `docs/STATE_REVIEW_2026-09-21.md` for evidence and ordered work. Recheck HEAD before acting; Antigravity may have moved the project on. First close staff privilege and organization-isolation gaps, then fix route/session boundaries, connect real UI workflows, add real database and browser acceptance tests, and replace readiness claims with operator-backed runtime proof.

User preference from this session: use project locations already supplied in attachments; inspect the supplied material before asking the user to repeat a path or repository name.

## Context and memory boundaries

This file is durable repository context, discoverable by local agents through AGENTS.md. It is not a write to ChatGPT's account-wide saved memory. Upload the portable context-and-review document to a ChatGPT Project's Sources for use across that project's chats. Local Codex memory and ChatGPT web memory are separate; automatic recall depends on product settings. Keep required guidance in project files rather than relying only on generated memory.

Sources for these product boundaries: https://learn.chatgpt.com/docs/projects and https://learn.chatgpt.com/docs/customization/memories (reviewed September 21, 2026).
