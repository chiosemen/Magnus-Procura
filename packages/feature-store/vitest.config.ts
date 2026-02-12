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
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100
      }
    }
  }
});
