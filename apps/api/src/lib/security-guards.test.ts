import { describe, it, expect, afterEach } from 'vitest';
import { isTestBypassEnabled, assertProductionSafety } from './env-guard';
import { getRateLimitStore, resetRateLimitStore } from './ratelimit';

/**
 * These cover the two controls that previously depended on a single
 * environment variable being correct: the authentication test bypass, and
 * whether rate limiting is shared across instances.
 */

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetRateLimitStore();
});

describe('env-guard: authentication test bypass', () => {
  it('is enabled inside a real Vitest run', () => {
    // This suite runs under Vitest, so both conditions genuinely hold here.
    expect(isTestBypassEnabled()).toBe(true);
  });

  it('is DISABLED when NODE_ENV=test is set without a test runner', () => {
    // The exact misconfiguration that would have disabled auth in a deployment.
    process.env.NODE_ENV = 'test';
    delete process.env.VITEST;
    expect(isTestBypassEnabled()).toBe(false);
  });

  it('is DISABLED in production even if VITEST leaks into the environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.VITEST = 'true';
    expect(isTestBypassEnabled()).toBe(false);
  });

  it('REFUSES to start a server carrying test-environment settings', () => {
    process.env.NODE_ENV = 'test';
    expect(() => assertProductionSafety()).toThrow(/Refusing to start/);

    process.env.NODE_ENV = 'production';
    process.env.VITEST = 'true';
    expect(() => assertProductionSafety()).toThrow(/Refusing to start/);
  });

  it('allows a correctly configured production server to start', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.VITEST;
    expect(() => assertProductionSafety()).not.toThrow();
  });
});

describe('rate limiting: store selection', () => {
  it('REFUSES per-instance limits in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.ALLOW_INSECURE_RATE_LIMIT;

    expect(() => getRateLimitStore()).toThrow(/Rate limiting is not configured for production/);
  });

  it('selects a distributed store when Upstash is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    const store = getRateLimitStore();
    expect(store.name).toBe('upstash-redis');
    expect(store.distributed).toBe(true);
  });

  it('allows an explicit single-replica opt-out', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.ALLOW_INSECURE_RATE_LIMIT = 'true';

    expect(getRateLimitStore().name).toBe('memory');
  });

  it('falls back to memory outside production without complaint', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.UPSTASH_REDIS_REST_URL;

    const store = getRateLimitStore();
    expect(store.name).toBe('memory');
    expect(store.distributed).toBe(false);
  });

  it('counts hits within a window and expires them after it', async () => {
    process.env.NODE_ENV = 'development';
    const store = getRateLimitStore();

    expect((await store.hit('k', 50)).count).toBe(1);
    expect((await store.hit('k', 50)).count).toBe(2);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect((await store.hit('k', 50)).count).toBe(1);
  });

  it('keys are isolated per client', async () => {
    process.env.NODE_ENV = 'development';
    const store = getRateLimitStore();

    await store.hit('client-a', 1000);
    await store.hit('client-a', 1000);
    expect((await store.hit('client-b', 1000)).count).toBe(1);
  });
});
