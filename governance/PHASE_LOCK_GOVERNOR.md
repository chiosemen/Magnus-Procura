# Phase Lock Governor

## Mandatory Controls

1. TypeScript strict mode must remain enabled.
2. `allowJs` must remain `false`.
3. `skipLibCheck` must remain `false`. Any exception requires written architecture approval.
4. Runtime CDN dependencies are prohibited, including `cdn.tailwindcss.com` and `esm.sh`.
5. Client-side provider keys and client-side secret handling are prohibited.
6. Authentication and RBAC must remain server-enforced.
7. Environment validation must remain fail-closed at server startup.
8. CI invariant suite and governor gate must remain enabled and blocking.

## Change Control

1. Any modification to governor-protected controls requires architecture review.
2. Any weakening of strictness, invariants, security headers, auth/RBAC boundaries, or env validation is blocked.
3. If governor checks fail, build and merge must fail.
