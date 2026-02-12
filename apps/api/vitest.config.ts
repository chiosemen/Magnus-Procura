import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['tests/setup-env.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', '../../scripts/invariants/**/*.mjs']
    }
  }
});
