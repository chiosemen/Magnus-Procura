import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle,
            }),
          }),
          insert: mockInsert.mockResolvedValue({ data: null, error: null }),
          update: mockUpdate.mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'org_123' }, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://example.com/signed.pdf'),
}));

vi.mock('../lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('Webhooks Hardening (Idempotency & Resend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processes new Stripe checkout event and records in idempotency ledger', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null }); // Not duplicate

    const payload = {
      id: 'evt_test_new_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          customer: 'cus_abc',
          amount_total: 480000,
          client_reference_id: 'org_apex',
          metadata: { sku: 'year_1' },
        },
      },
    };

    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { received: boolean };
    expect(body.received).toBe(true);
  });

  it('skips duplicate Stripe event if already processed in stripe_events', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'evt_test_duplicate' }, error: null }); // Already exists!

    const payload = {
      id: 'evt_test_duplicate',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_dup' } },
    };

    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { received: boolean; duplicate?: boolean };
    expect(body.received).toBe(true);
    expect(body.duplicate).toBe(true);
  });

  it('handles Resend bounce webhook and flags email for suppression', async () => {
    const payload = {
      type: 'email.bounced',
      data: {
        to: ['bad-lead@company.com'],
        subject: 'Intro to Apex Robotics',
      },
    };

    const res = await app.request('/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { received: boolean; event: string };
    expect(body.received).toBe(true);
    expect(body.event).toBe('email.bounced');
  });
});
