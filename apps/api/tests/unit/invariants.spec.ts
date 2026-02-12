import { describe, expect, it } from 'vitest';

import { checkEnvValidation } from '../../../../scripts/invariants/check-env-validation.mjs';
import { checkNoCdn } from '../../../../scripts/invariants/check-no-cdn.mjs';
import { checkNoRoleToggle } from '../../../../scripts/invariants/check-no-role-toggle.mjs';
import { checkStrictTypescript } from '../../../../scripts/invariants/check-strict-ts.mjs';

describe('invariant checks', () => {
  it('passes anti-cdn invariant', () => {
    expect(() => checkNoCdn()).not.toThrow();
  });

  it('passes anti-role-toggle invariant', () => {
    expect(() => checkNoRoleToggle()).not.toThrow();
  });

  it('passes strict typescript invariant', () => {
    expect(() => checkStrictTypescript()).not.toThrow();
  });

  it('passes env validation presence invariant', () => {
    expect(() => checkEnvValidation()).not.toThrow();
  });
});
