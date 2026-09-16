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
import { getSupabaseAdmin } from './lib/supabase';

dotenv.config();

const app = new Hono();

// Request Correlation & Timing Middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || randomUUID();
  c.header('x-request-id', requestId);
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header('x-response-time', `${duration}ms`);
});

// Standard Logging & CORS
app.use('*', logger());
app.use('*', cors({
  origin: process.env.APP_URL || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}));

// Deep Healthcheck (Postgres pool, uptime, memory, version)
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

  return c.json({
    status: 'healthy',
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
  });
});

// Mounted Routes
app.route('/billing', billing);
app.route('/webhooks', webhooks);
app.route('/intros', intros);
app.route('/attestations', attestations);
app.route('/exports', exportsRoute);
app.route('/jobs', jobs);

const port = Number(process.env.PORT) || 8787;

if (process.env.NODE_ENV !== 'test') {
  console.log(`[Magnus API] Server starting on port ${port}...`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
