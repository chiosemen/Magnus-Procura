import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      all: true,
      reporter: ['text', 'json-summary'],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95
      }
    }
  }
});

