import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

import billing from './routes/billing';
import webhooks from './routes/webhooks';
import intros from './routes/intros';
import attestations from './routes/attestations';
import exportsRoute from './routes/exports';
import jobs from './routes/jobs';
import targets from './routes/targets';
import fit from './routes/fit';
import scoreboard from './routes/scoreboard';
import { getSupabaseAdmin } from './lib/supabase';
import { rateLimit } from './lib/ratelimit';

dotenv.config();

const app = new Hono();

// 1. Request Correlation, Timing & HTTP Security Headers
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || randomUUID();
  c.header('x-request-id', requestId);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-XSS-Protection', '1; mode=block');

  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header('x-response-time', `${duration}ms`);
});

// 2. Standard Logging
app.use('*', logger());

// 3. Strict CORS Origin Policy
const allowedOrigins = process.env.APP_URL
  ? [process.env.APP_URL]
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use('*', cors({
  origin: (origin) => {
    // In test or local dev without origin header (e.g. server-to-server or curl)
    if (!origin) return allowedOrigins[0];
    if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'test')) {
      return origin;
    }
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'stripe-signature'],
  credentials: true,
}));

// 4. Rate Limiting Defense
app.use('*', rateLimit({ windowMs: 60 * 1000, max: 120, skipInTest: true }));

// 5. Deep Healthcheck (Postgres pool, uptime, memory, version)
app.get('/health', async (c) => {
  const startTime = Date.now();
  let dbStatus = 'ok';
  let dbLatencyMs = 0;

  try {
    const supabase = getSupabaseAdmin();
    const t0 = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    dbLatencyMs = Date.now() - t0;
    if (error) {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'unreachable';
  }

  const mem = process.memoryUsage();
  const isHealthy = dbStatus === 'ok';

  return c.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'magnus-procura-api',
      version: '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        memory: {
          rssMb: Math.round(mem.rss / (1024 * 1024)),
          heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        },
      },
      latencyMs: Date.now() - startTime,
    },
    isHealthy ? 200 : 503
  );
});

// Mounted Routes
app.route('/billing', billing);
app.route('/webhooks', webhooks);
app.route('/intros', intros);
app.route('/attestations', attestations);
app.route('/exports', exportsRoute);
app.route('/jobs', jobs);
app.route('/targets', targets);
app.route('/fit', fit);
app.route('/scoreboard', scoreboard);

const port = Number(process.env.PORT) || 8787;

let server: ReturnType<typeof serve> | null = null;

if (process.env.NODE_ENV !== 'test') {
  console.log(`[Magnus API] Server starting on port ${port}...`);
  server = serve({
    fetch: app.fetch,
    port,
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Magnus API] Received shutdown signal. Closing active connections...');
    if (server) {
      server.close(() => {
        console.log('[Magnus API] HTTP server closed gracefully.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
