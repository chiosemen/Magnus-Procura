import { describe, it, expect, vi } from 'vitest';
import app from '../index';

// Mock Stripe library
vi.mock('../lib/stripe', () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/c/pay/cs_test_123',
  }),
  createCustomerPortalSession: vi.fn().mockResolvedValue({
    id: 'bps_test_123',
    url: 'https://billing.stripe.com/p/session/bps_test_123',
  }),
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_test_123' },
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  }),
}));

describe('Billing Routes', () => {
  it('validates required fields on POST /billing/checkout', async () => {
    const res = await app.request('/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Invalid checkout parameters');
  });

  it('creates Stripe checkout session successfully', async () => {
    const res = await app.request('/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: '10000000-0000-0000-0000-000000000002',
        sku: 'year_1',
        billingInterval: 'prepaid',
        customerEmail: 'owner@apexindustrial.com',
        successUrl: 'https://app.magnusprocura.com/billing?success=true',
        cancelUrl: 'https://app.magnusprocura.com/billing?canceled=true',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessionId: string; sessionUrl: string };
    expect(body.sessionId).toBe('cs_test_123');
    expect(body.sessionUrl).toContain('checkout.stripe.com');
  });

  it('rejects unauthenticated requests on POST /billing/portal', async () => {
    const res = await app.request('/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: '10000000-0000-0000-0000-000000000002',
        returnUrl: 'https://app.magnusprocura.com/billing',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('creates Customer Portal session for authenticated existing customer', async () => {
    const res = await app.request('/billing/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-admin-token',
      },
      body: JSON.stringify({
        orgId: '10000000-0000-0000-0000-000000000002',
        returnUrl: 'https://app.magnusprocura.com/billing',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { portalUrl: string };
    expect(body.portalUrl).toContain('billing.stripe.com');
  });
});
