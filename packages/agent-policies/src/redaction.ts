const secretKeyPattern = /(api[-_]?key|authorization|token|secret|password|session|cookie)/i;

export const redactString = (value: string): string => {
  if (value.length <= 6) {
    return '[REDACTED]';
  }
  const prefix = value.slice(0, 2);
  const suffix = value.slice(-2);
  return `${prefix}[REDACTED]${suffix}`;
};

export const redact = (value: unknown): unknown => {
  if (value === null) return null;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(record)) {
      if (secretKeyPattern.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redact(v);
      }
    }
    return out;
  }
  return '[REDACTED]';
};

