# Magnus Procura

Production-hardened procurement platform with strict TypeScript, secure API boundary, server-enforced RBAC, and invariant-gated CI.

## Prerequisites

- Node.js 22.16.0+
- pnpm 10.9.0+

## Setup

1. Copy `.env.example` to `.env` and set real secrets.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run API + client:
   ```bash
   pnpm dev
   ```

## Quality Gates

```bash
pnpm typecheck
pnpm lint
pnpm governor
pnpm test
pnpm build
pnpm boundary:check
```

## Server Security Model

- Provider SDK access is server-only.
- Auth is cookie-based and server-verified.
- RBAC is enforced on every protected API route.
- Env validation is fail-closed at process startup.
