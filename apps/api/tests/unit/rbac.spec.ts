import { describe, expect, it } from 'vitest';

import { hasRole } from '../../src/middleware/auth.ts';

describe('RBAC role checks', () => {
  it('allows explicit role membership', () => {
    expect(hasRole('BUYER', ['BUYER', 'ADMIN'])).toBe(true);
  });

  it('denies role not in allow-list', () => {
    expect(hasRole('SUPPLIER', ['BUYER', 'ADMIN'])).toBe(false);
  });
});
