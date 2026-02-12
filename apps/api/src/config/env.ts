import { config } from 'dotenv';
import { z } from 'zod';

config();

const hashPattern = /^\$2[aby]\$\d{2}\$.{53}$/;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1).max(65535))
    .default('4000'),
  CORS_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().min(3).default('magnus_session'),
  SESSION_TTL_SECONDS: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(60).max(60 * 60 * 24))
    .default('3600'),
  AUTH_COOKIE_SECURE: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(['true', 'false']))
    .transform((value) => value === 'true')
    .default('true'),
  AUTH_SUPPLIER_USERNAME: z.string().min(3),
  AUTH_SUPPLIER_PASSWORD_HASH: z.string().regex(hashPattern),
  AUTH_BUYER_USERNAME: z.string().min(3),
  AUTH_BUYER_PASSWORD_HASH: z.string().regex(hashPattern),
  AUTH_ADMIN_USERNAME: z.string().min(3),
  AUTH_ADMIN_PASSWORD_HASH: z.string().regex(hashPattern),
  GEMINI_API_KEY: z.string().min(10),
  OPENAI_API_KEY: z.string().min(10).optional(),
  ANTHROPIC_API_KEY: z.string().min(10).optional(),
  SCORING_WORKER_MAX_ATTEMPTS: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1).max(50))
    .default('10'),
  SCORING_WORKER_RETRY_BASE_MS: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(0).max(60_000))
    .default('1000'),
  SCORING_WORKER_POLL_INTERVAL_MS: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(50).max(60_000))
    .default('500'),
  SCORING_WORKER_ML_MODE: z.enum(['disabled', 'required']).default('disabled'),
  AGENT_MAX_RUNTIME_MS: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1000).max(60_000))
    .default('15000'),
  AGENT_MAX_RUNS_PER_MINUTE: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1).max(1000))
    .default('20'),
  AGENT_MAX_RUNS_PER_DAY: z
    .string()
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1).max(100_000))
    .default('500'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TELEMETRY_DSN: z.string().url().optional()
});

export const parseEnv = (source: NodeJS.ProcessEnv) => {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  return parsed.data;
};

export const env = parseEnv(process.env);
