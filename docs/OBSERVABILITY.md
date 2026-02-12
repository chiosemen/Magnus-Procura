# Observability

## Logging

1. Structured logs via `pino` and `pino-http`.
2. Request IDs are generated or propagated from `x-request-id`.
3. Sensitive headers/cookies are redacted.

## Error Telemetry

1. All HTTP errors are normalized through a global handler.
2. 5xx and internal exceptions are captured by telemetry sink.
3. Response payload includes error code and request ID.

## Non-Swallowing Policy

1. Upstream failures throw explicit `UpstreamServiceError`.
2. Route handlers pass failures to centralized middleware.
3. Silent fallback responses are disallowed.
