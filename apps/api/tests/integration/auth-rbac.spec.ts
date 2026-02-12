import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import type { Express } from 'express';

const setDefault = (key: string, value: string): void => {
  process.env[key] = value;
};

let app: Express;

describe('auth and rbac integration', () => {
  beforeAll(async () => {
    setDefault('NODE_ENV', 'test');
    setDefault('PORT', '4000');
    setDefault('CORS_ORIGIN', 'http://127.0.0.1:3000');
    setDefault('JWT_SECRET', 'test-jwt-secret-string-with-sufficient-length');
    setDefault('SESSION_COOKIE_NAME', 'magnus_session');
    setDefault('SESSION_TTL_SECONDS', '900');
    setDefault('AUTH_COOKIE_SECURE', 'false');
    setDefault('AUTH_SUPPLIER_USERNAME', 'supplier');
    setDefault('AUTH_SUPPLIER_PASSWORD_HASH', bcrypt.hashSync('SupplierPass!123', 10));
    setDefault('AUTH_BUYER_USERNAME', 'buyer');
    setDefault('AUTH_BUYER_PASSWORD_HASH', bcrypt.hashSync('BuyerPass!123', 10));
    setDefault('AUTH_ADMIN_USERNAME', 'admin');
    setDefault('AUTH_ADMIN_PASSWORD_HASH', bcrypt.hashSync('AdminPass!123', 10));
    setDefault('GEMINI_API_KEY', 'gemini-key-1234567890');
    setDefault('LOG_LEVEL', 'error');

    const module = await import('../../src/app.ts');
    app = module.createApp();
  });

  it('requires authentication for protected route', async () => {
    const response = await request(app).get('/api/buyer/opportunities');
    expect(response.status).toBe(401);
  });

  it('rejects supplier role on buyer-only route', async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post('/api/auth/login').send({
      username: 'supplier',
      password: 'SupplierPass!123'
    });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get('/api/buyer/opportunities');
    expect(response.status).toBe(403);
  });

  it('allows buyer role on buyer-only route', async () => {
    const agent = request.agent(app);

    const loginResponse = await agent.post('/api/auth/login').send({
      username: 'buyer',
      password: 'BuyerPass!123'
    });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get('/api/buyer/opportunities');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.opportunities)).toBe(true);
  });
});
