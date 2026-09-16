# Magnus Procura — Anti-Opaque Enterprise Sourcing Platform

Magnus Procura is an anti-opaque-intermediary platform connecting agile B2B suppliers with enterprise buyers through transparent, verifiable readiness packets ("The File"), named-champion introductions, and contractually enforced SLA delivery clocks.

---

## Architecture & Monorepo Structure

Magnus Procura is organized as a high-performance `pnpm` monorepo:

- **`apps/web`**: Next.js 15 (App Router), Tailwind CSS, `@supabase/ssr` (18 client surfaces across Member, Operator, Partner, and Public portals).
- **`apps/api`**: Node 22 + Hono privileged backend service running on Railway (Stripe webhooks, Resend transactional emails, 24h signed storage URLs, ZIP export streaming, and cron jobs).
- **`packages/db`**: Postgres database schema, Drizzle ORM models, generated TypeScript types, and synthetic lifecycle test suites.
- **`supabase/`**: 7 sequential SQL migrations, seed data, and Row Level Security (RLS) policies.
- **`infra/`**: Railway multi-service orchestration (`railway.toml`) and automated cron schedules (`cron.json`).
- **`scripts/`**: Automated invariant tests (`check-no-client-secrets`, `check-rls-coverage`, `check-intro-person-constraint`) and deployment verifiers.

---

## Core Invariants & Architectural Contracts

1. **Postgres is the Product**: Every introduction, SLA clock, stage transition, and attestation is stored in Postgres tables and SQL views.
2. **Zero Client Secrets**: Service role keys, Stripe secret keys, Resend keys, and cron secrets are strictly isolated in `apps/api` and never exposed to the browser.
3. **100% Forced RLS**: All 25 database tables have `ENABLE` and `FORCE ROW LEVEL SECURITY` with explicit multi-tenant policies.
4. **Clock Starts at Packet Ready**: Introductions cannot be drafted or sent while "The File" packet is in a `blocked` status.
5. **Named Human Champions**: Every introduction strictly requires a named human champion (`intros.person_id NOT NULL`). Events cannot be promoted to intros without a champion.
6. **5+5 Target Account Limit**: Strict database trigger (`trg_enforce_account_target_limits`) limits members to 5 primary and 5 bench targets.
7. **180-Day Decline Cooldown**: Rejected introductions enforce a 180-day cooling off period before re-approach.
8. **Loaded COGS Discipline**: Operators manage a maximum of 15 members; 15-hour annual budget per member ($120/hr loaded rate = $1,800 cap per $4,800 contract).
9. **Capped Success Fees**: 8% success fee on the first purchase order is strictly capped at $8,000 on Net 15 terms.
10. **Keep-90 Bounty Ledger**: Partner referral bounties ($500) are paid out on Day 91 post-keep without refund.

---

## Local Development

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.0.0
- Supabase CLI (optional for local DB emulation)
- Stripe CLI (optional for local webhook forwarding)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Servers
```bash
# Run all services concurrently (web on :3000, api on :8787)
pnpm dev

# Or run individual services
pnpm dev:web
pnpm dev:api
```

---

## Testing & Quality Verification

```bash
# Run strict TypeScript checks across all workspaces
pnpm typecheck

# Run all unit, integration, and synthetic lifecycle test suites + invariant checks
pnpm test

# Run automated security & database invariant audits
pnpm test:invariants

# Run full production build across all workspaces
pnpm build
```

---

## Continuous Integration & Deployment

The repository includes a GitHub Actions CI pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) that validates strict type safety, all test suites, invariant security rules, and production bundle builds on every pull request and push to `main`.
