import type { Context, Next } from 'hono';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipInTest?: boolean;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, ClientRecord>();

// Periodic cleanup of expired rate limit records every 5 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
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

    const route = c.req.path;
    const key = `${ip}:${route}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(max - 1));
      c.header('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfterSeconds));
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
      return c.json({ error: message, retryAfterSeconds }, 429);
    }

    record.count += 1;
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(max - record.count));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
    return next();
  };
}
