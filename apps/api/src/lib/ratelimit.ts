import type { Context, Next } from 'hono';

/**
 * Rate limiting with a pluggable backing store.
 *
 * The in-process Map that previously backed this middleware silently stopped
 * being a security control the moment the API ran more than one instance: with
 * N replicas an attacker gets N x max requests per window, and every deploy
 * reset all counters to zero. Railway's restart policy and any horizontal
 * scaling both trigger that. The store is therefore selected from the
 * environment, and production refuses to boot on the in-memory one.
 */

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipInTest?: boolean;
}

export interface RateLimitHit {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  readonly name: string;
  readonly distributed: boolean;
  hit(key: string, windowMs: number): Promise<RateLimitHit>;
}

/**
 * Single-process store. Correct only when exactly one instance is running,
 * which is why it is rejected in production unless explicitly overridden.
 */
class MemoryStore implements RateLimitStore {
  public readonly name = 'memory';
  public readonly distributed = false;
  private readonly records = new Map<string, RateLimitHit>();

  public constructor() {
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.records.entries()) {
          if (now > record.resetAt) this.records.delete(key);
        }
      }, 5 * 60 * 1000).unref();
    }
  }

  public async hit(key: string, windowMs: number): Promise<RateLimitHit> {
    const now = Date.now();
    const existing = this.records.get(key);
    if (!existing || now > existing.resetAt) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.records.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }
}

/**
 * Upstash Redis over its REST API — shared across every instance, and reached
 * with fetch so the API gains no new runtime dependency. INCR followed by a
 * first-hit PEXPIRE gives an atomic fixed-window counter.
 */
class UpstashRedisStore implements RateLimitStore {
  public readonly name = 'upstash-redis';
  public readonly distributed = true;

  public constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  private async command(...args: (string | number)[]): Promise<unknown> {
    const response = await fetch(`${this.url}/${args.map(encodeURIComponent).join('/')}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }
    const body = (await response.json()) as { result?: unknown };
    return body.result;
  }

  public async hit(key: string, windowMs: number): Promise<RateLimitHit> {
    const count = Number(await this.command('INCR', key));
    if (count === 1) {
      await this.command('PEXPIRE', key, windowMs);
    }
    const ttl = Number(await this.command('PTTL', key));
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
    return { count, resetAt };
  }
}

function createStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new UpstashRedisStore(url.replace(/\/+$/, ''), token);
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_RATE_LIMIT !== 'true') {
    throw new Error(
      'Rate limiting is not configured for production. Set UPSTASH_REDIS_REST_URL and ' +
      'UPSTASH_REDIS_REST_TOKEN so limits are shared across instances, or set ' +
      'ALLOW_INSECURE_RATE_LIMIT=true to accept per-instance limits (single-replica deployments only).'
    );
  }

  return new MemoryStore();
}

let store: RateLimitStore | undefined;

/** Resolves the process-wide store, constructing it on first use. */
export function getRateLimitStore(): RateLimitStore {
  store ??= createStore();
  return store;
}

/** Test seam: resets the memoized store so store selection can be exercised. */
export function resetRateLimitStore(): void {
  store = undefined;
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    skipInTest = true,
  } = options;

  return async function rateLimitMiddleware(c: Context, next: Next) {
    if (skipInTest && process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1';

    const key = `ratelimit:${ip}:${c.req.path}`;

    let record: RateLimitHit;
    try {
      record = await getRateLimitStore().hit(key, windowMs);
    } catch (err) {
      // Fail closed: if the shared counter is unreachable we cannot prove the
      // caller is under the limit, and an outage must not become an open door.
      console.error('[RateLimit] Store unavailable, rejecting request:', err);
      return c.json({ error: 'Rate limiting temporarily unavailable.' }, 503);
    }

    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - Date.now()) / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: message, retryAfterSeconds }, 429);
    }

    return next();
  };
}
