import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4001'
  },
  webServer: {
    command: 'tsx scripts/start-test-server.ts',
    url: 'http://127.0.0.1:4001/health',
    reuseExistingServer: false,
    timeout: 30000
  }
});
