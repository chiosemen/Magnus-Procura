import { describe, expect, it } from 'vitest';

import { redact } from '../src/redaction.js';

describe('redact', () => {
  it('redacts obvious secret-like keys deterministically', () => {
    const input = {
      apiKey: 'sk-test-123456',
      authorization: 'Bearer abcdef',
      nested: {
        token: 't-123456',
        ok: true,
        count: 3
      }
    };

    const out = redact(input) as Record<string, unknown>;
    expect(out['apiKey']).toBe('[REDACTED]');
    expect(out['authorization']).toBe('[REDACTED]');

    const nested = out['nested'] as Record<string, unknown>;
    expect(nested['token']).toBe('[REDACTED]');
    expect(nested['ok']).toBe(true);
    expect(nested['count']).toBe(3);
  });
});

