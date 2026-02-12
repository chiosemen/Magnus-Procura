export const computeBackoffMs = (retryBaseMs: number, attemptCount: number): number => {
  const base = Math.max(0, Math.trunc(retryBaseMs));
  const attempt = Math.max(0, Math.trunc(attemptCount));
  const exponent = Math.max(0, attempt - 1);
  const raw = base * Math.pow(2, exponent);
  return Math.min(Math.trunc(raw), 60_000);
};

