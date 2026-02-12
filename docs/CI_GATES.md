# CI Gates

Pipeline stages:
1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run governor`
5. `npm run test`
6. `npm run build`
7. `npm run invariant:ci`

## Invariant Rules

1. Fail on CDN references (`cdn.tailwindcss.com`, `esm.sh`) in `index.html`.
2. Fail if client source or bundle references provider keys or provider SDK.
3. Fail if client role-switching patterns are present.
4. Fail if strict TypeScript is disabled or JS-allowance is enabled.
5. Fail if env validation module or server env import is missing.
