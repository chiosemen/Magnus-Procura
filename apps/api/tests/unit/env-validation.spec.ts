import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { parseEnv } from '../../src/config/env.ts';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  CORS_ORIGIN: 'http://127.0.0.1:3000',
  DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/magnus_test',
  JWT_SECRET: 'test-jwt-secret-string-with-sufficient-length',
  SESSION_COOKIE_NAME: 'magnus_session',
  SESSION_TTL_SECONDS: '900',
  AUTH_COOKIE_SECURE: 'false',
  AUTH_SUPPLIER_USERNAME: 'supplier',
  AUTH_SUPPLIER_PASSWORD_HASH: bcrypt.hashSync('SupplierPass!123', 10),
  AUTH_BUYER_USERNAME: 'buyer',
  AUTH_BUYER_PASSWORD_HASH: bcrypt.hashSync('BuyerPass!123', 10),
  AUTH_ADMIN_USERNAME: 'admin',
  AUTH_ADMIN_PASSWORD_HASH: bcrypt.hashSync('AdminPass!123', 10),
  GEMINI_API_KEY: 'gemini-key-1234567890'
};

describe('environment validation', () => {
  it('parses valid env values', () => {
    const parsed = parseEnv(validEnv);

    expect(parsed.PORT).toBe(4000);
    expect(parsed.NODE_ENV).toBe('test');
  });

  it('fails when required env values are missing', () => {
    expect(() => {
      parseEnv({
        ...validEnv,
        JWT_SECRET: ''
      });
    }).toThrowError(/Environment validation failed/);
  });
});
