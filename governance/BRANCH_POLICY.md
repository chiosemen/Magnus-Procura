# Branch Protection Policy

1. `main` requires all CI checks green before merge.
2. The governor gate (`pnpm governor`) cannot be disabled, skipped, or downgraded.
3. `architecture/*` branches require architecture review approval before merge.
4. Force push to `main` is prohibited.
