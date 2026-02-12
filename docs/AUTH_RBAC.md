# Auth and RBAC

## Authentication Flow

1. Client submits `POST /api/auth/login` with username/password.
2. Server validates credentials against bcrypt hashes.
3. Server mints JWT and stores it in `HttpOnly` cookie.
4. Client session is resolved via `GET /api/auth/me`.

## Authorization Model

Roles:
- `SUPPLIER`
- `BUYER`
- `ADMIN`

Enforced routes:
- `POST /api/supplier/readiness` => `SUPPLIER`, `ADMIN`
- `POST /api/supplier/codes` => `SUPPLIER`, `ADMIN`
- `GET /api/buyer/opportunities` => `BUYER`, `ADMIN`
- `POST /api/contracts/analyze` => `SUPPLIER`, `BUYER`, `ADMIN`

## Enforcement

1. `requireAuth` verifies JWT cookie server-side.
2. `requireRole` validates route-level allow-lists.
3. Client-side role switching is forbidden and invariant-blocked.
