# Magnus Procura — Security Policy

**Status:** binding on all code in this repository, human- or agent-authored.
**Grounding:** [OWASP Top 10:2021](https://owasp.org/Top10/).

This document is a contract, not advice. Work that violates a MUST rule is
rejected in review regardless of who or what wrote it, and regardless of whether
tests pass.

---

## 0. How to use this before writing code

Reason about the security consequences of an approach **before** implementing it,
not after. Every pull request must answer, in its own words:

> What are the security risks of this approach, and how does this change avoid them?

An answer of "none" is only acceptable for changes that touch no input, no
authorization decision, no secret, no database policy and no external call.

When a requirement here conflicts with a convenience, the requirement wins. When
a requirement here conflicts with a product deadline, escalate — do not silently
choose.

---

## 1. Non-negotiable rules

| # | Rule | Enforced by |
|---|---|---|
| **S1** | No secret may be reachable from browser-delivered code. Service-role keys, Stripe secrets, Resend keys and cron secrets live only in `apps/api`. | `scripts/invariants/check-no-client-secrets.mjs` (CI) |
| **S2** | Every table in `public` has `ENABLE` **and** `FORCE ROW LEVEL SECURITY` and at least one policy. New tables included. | `scripts/invariants/check-rls-coverage.mjs` — live `pg_policies` query (CI) |
| **S3** | No hardcoded credentials, API keys, tokens or connection strings in source. Secrets arrive by injection only. | CodeQL + review |
| **S4** | API keys are transmitted in headers, never in URLs or query strings. | Review (see `packages/agent-providers/*`) |
| **S5** | All external input is parsed and validated at the trust boundary with Zod before use. | Review |
| **S6** | All SQL uses parameterised queries. String-concatenated SQL is prohibited. | CodeQL + review |
| **S7** | Authentication and authorization bypasses must require two independent conditions, one of which cannot be set by deployment configuration. | `apps/api/src/lib/env-guard.ts`, `apps/api/src/lib/security-guards.test.ts` |
| **S8** | Security controls fail **closed**. If a control cannot be evaluated, deny. | Review |
| **S9** | Every new feature ships with tests. Security-relevant features ship with tests that fail when the control is removed. | Review — see §4 |
| **S10** | Database schema changes are proven by execution against real PostgreSQL, never by pattern-matching migration text. | `pnpm db:setup` + `packages/db/tests/*.spec.ts` (CI) |

---

## 2. OWASP Top 10 — mapped to this codebase

### A01 Broken Access Control — *highest risk here*

Authorization is enforced in three independent layers that must agree: Next.js
edge middleware (`apps/web/src/middleware.ts`), Hono route guards
(`apps/api/src/lib/auth.ts`), and Postgres RLS policies.

- **MUST** enforce org scoping at the API layer *and* rely on RLS as the backstop. Neither alone is sufficient.
- **MUST NOT** derive privilege from any client-controllable value. `raw_user_meta_data` and `user_metadata` are attacker-controlled; only `raw_app_meta_data` and verified database columns may set `is_internal`.
- **MUST** add an RLS authorization test to `packages/db/tests/rls-authz.spec.ts` for any new privilege boundary.
- Cross-tenant reads and writes are tested explicitly, not assumed.

### A02 Cryptographic Failures

- **MUST** compare secrets (cron tokens, webhook secrets) in constant time.
- **MUST** transmit all traffic over TLS; HSTS is set in `apps/api/src/index.ts`.
- **MUST NOT** log tokens, keys, tax identity or banking details. `packages/agent-policies/src/redaction.ts` defines the redaction set; extend it when new sensitive fields are introduced.

### A03 Injection

- **MUST** use parameterised queries everywhere.
- **MUST** treat LLM output as untrusted input. Agent tool calls are validated against a Zod schema before dispatch; a model's output never becomes SQL, a shell command, or a URL without validation.

### A04 Insecure Design

- Rate limiting **MUST** be shared across instances in production (`apps/api/src/lib/ratelimit.ts`). A per-process counter is not a control once more than one replica runs.
- Idempotency **MUST** be enforced by a database constraint, not by a read-then-write check. Read-then-write is a TOCTOU race under concurrency.
- Money paths (success fees, bounties, refunds) **MUST** be idempotent and bounded by explicit caps.

### A05 Security Misconfiguration

- Production **MUST NOT** boot with test-environment settings; `assertProductionSafety()` enforces this at startup.
- `scripts/deploy/verify-env.mjs` **MUST** exit non-zero on missing production variables.
- Security headers and CSP are configured in `apps/api/src/index.ts` and `apps/web/next.config.ts`.

### A06 Vulnerable and Outdated Components

- `pnpm audit --audit-level high` runs in CI and fails the build.
- Dependency updates are reviewed, not auto-merged.

### A07 Identification and Authentication Failures

- Sessions are Supabase JWTs verified server-side on every request. **MUST NOT** trust a decoded JWT body without verification.
- Bearer tokens **MUST NOT** be attached to any origin other than the configured API origin (`apps/web/src/lib/api.ts`).

### A08 Software and Data Integrity Failures

- Build output (`dist/`) **MUST NOT** be committed. A stale or partial committed artifact can ship code that differs from source.
- Stripe and Resend webhooks **MUST** verify signatures before acting.
- The scoring evidence chain **MUST** write its audit anchor and score snapshot in a single transaction.

### A09 Security Logging and Monitoring Failures

- Privileged actions are written to `public.audit_log`.
- **Known gap:** there is no error tracking and no alerting on cron job failure. Cron jobs drive the contractual SLA clocks, so silent failure is a business-critical blind spot. This must close before beta.

### A10 Server-Side Request Forgery

- **MUST NOT** fetch a URL derived from user or model input without an allowlist check.
- Provider base URLs are configuration, never request data.

---

## 3. Data classification

| Class | Examples | Handling |
|---|---|---|
| **Secret** | Service-role keys, Stripe/Resend keys, cron secrets, webhook secrets | `apps/api` only. Never logged. Rotate on exposure. |
| **Sensitive** | Champion PII, `do_not_serve` entries, insurance certificates, tax identity (EIN/DUNS), banking details | RLS-scoped. Redacted in logs and agent transcripts. |
| **Internal** | Operator hours, unit economics, cohort data | Internal staff and assigned operators only. |
| **Member** | An organization's own packet, targets, intros | Readable only by that org, its assigned operator, and admins. |

---

## 4. What "tested" means

A security test that cannot fail is not a test. For any control added or changed:

1. Write the test asserting the control **blocks** the attack.
2. Remove or weaken the control and confirm the test **fails**.
3. Restore the control and confirm the test passes.

`packages/db/tests/rls-authz.spec.ts` is the reference example: it was validated
by re-introducing the permissive policy and observing the escalation tests fail.

---

## 5. Change process

- All changes reach `main` through a pull request. Direct pushes are prohibited.
- CI must be green, including the database, invariant and CodeQL jobs.
- Any change touching authentication, authorization, RLS, money or secrets
  requires explicit security review and an entry in this document if it
  introduces a new rule or a new known gap.
