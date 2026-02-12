# Security Baseline

## Baseline Controls

1. CSP enabled in `index.html` and API via `helmet` in `server/src/app.ts`.
2. Permissions Policy denies camera/microphone/geolocation.
3. `X-Powered-By` disabled.
4. Cookie-based auth is `HttpOnly`, `SameSite=Strict`, and configurable `Secure`.
5. Client contains no provider SDK and no API key access.

## Secret Handling

1. `GEMINI_API_KEY` is loaded only in server env validation.
2. Client-side secret use is blocked by invariants.
3. API key leakage in built artifacts is blocked by invariants.

## Fail-Closed Behavior

1. Invalid env config terminates process startup.
2. Missing/invalid auth tokens return `401`.
3. Invalid role access returns `403`.
4. Unknown routes return `404`.
5. Unhandled errors return `500` with request-scoped IDs.
