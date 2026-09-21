# Magnus Procura — engineering contract for agents

This repository is Magnus Procura, the supplier-readiness and enterprise-introduction
platform. It is distinct from Magnus Findr / ResellerFinder and other Magnus projects.

## Read before planning any work

1. **`docs/SECURITY-POLICY.md`** — binding. OWASP-grounded rules that code must
   satisfy. Violating a MUST rule fails review regardless of passing tests.
2. **`docs/INVARIANTS.md`** — the ten product invariants, their enforcement
   points, and which are actually proven. Touching an invariant means updating
   its proof in the same change.
3. **`docs/PROJECT_CONTEXT.md`** — durable business and architecture context.
4. **`docs/STATE_REVIEW_2026-09-21.md`** — dated review and outstanding gaps.

Dated documents are context, not proof that HEAD or production is unchanged.
Verify the relevant code and current status before relying on them.

## Non-negotiable working rules

- **Reason about security before writing code, not after.** Every pull request
  must answer: *what are the security risks of this approach, and how does this
  change avoid them?* The PR template asks for this explicitly.
- **Every feature ships with tests.** For security controls, verify the test by
  removing the control and confirming the test fails. A test that cannot fail is
  not evidence.
- **Schema changes are proven by execution.** Run `pnpm db:setup` against a real
  PostgreSQL instance. Pattern-matching migration text proves only that a string
  appears in a file.
- **Never commit build output.** `dist/` is gitignored. A stale committed
  artifact can ship code that differs from source.
- **All work reaches `main` through a pull request.** No direct pushes.
- **Do not widen scope on your own.** Deliver what was asked; raise anything
  else you find rather than fixing it silently in the same change.

## Verifying your work

```bash
pnpm install
pnpm db:setup          # requires DATABASE_URL — applies all migrations for real
pnpm test              # builds first, then runs every workspace suite
pnpm test:invariants   # secrets, live RLS coverage, anti-opaque constraints
```

Report what you actually ran and what it printed. Do not report a result you did
not observe, and do not describe CI as green without naming the run.

## Handling of sensitive material

Customer compliance artifacts, operator diligence, billing and authorization are
sensitive. Do not store credentials or customer records in context files.
Reading a historical plan does not authorize its deploy, payment, email or
migration steps.

Update dated context when later verified work supersedes it; do not preserve old
readiness claims as current facts.
