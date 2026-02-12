import { expect, request as playwrightRequest, test } from '@playwright/test';

test('buyer endpoint denies unauthenticated access', async ({ request }) => {
  const response = await request.get('/api/buyer/opportunities');
  expect(response.status()).toBe(401);
});

test('supplier cannot access buyer-only route', async ({ baseURL }) => {
  const supplierContext = await playwrightRequest.newContext({ baseURL });

  const loginResponse = await supplierContext.post('/api/auth/login', {
    data: {
      username: 'supplier',
      password: 'SupplierPass!123'
    }
  });

  expect(loginResponse.status()).toBe(200);

  const response = await supplierContext.get('/api/buyer/opportunities');
  expect(response.status()).toBe(403);

  await supplierContext.dispose();
});

test('buyer can access buyer-only route', async ({ baseURL }) => {
  const buyerContext = await playwrightRequest.newContext({ baseURL });

  const loginResponse = await buyerContext.post('/api/auth/login', {
    data: {
      username: 'buyer',
      password: 'BuyerPass!123'
    }
  });

  expect(loginResponse.status()).toBe(200);

  const response = await buyerContext.get('/api/buyer/opportunities');
  expect(response.status()).toBe(200);

  const payload = await response.json();
  expect(Array.isArray(payload.opportunities)).toBe(true);

  await buyerContext.dispose();
});
