import { describe, it, expect, vi } from 'vitest';
import app from '../index';

let mockAttestation = {
  id: 'att_123',
  org_id: '10000000-0000-0000-0000-000000000002',
  amount_cents: 5000000, // $50,000.00
  buyer: 'Lockheed Martin',
  status: 'submitted',
};

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'attestations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => Promise.resolve({
                data: mockAttestation,
                error: null,
              })),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === 'invoices') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'inv_success_123' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
}));

describe('Attestation Approval & Success Fee Calculation', () => {
  it('rejects unauthenticated requests without authorization header', async () => {
    const res = await app.request('/attestations/att_123/accept', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
  });

  it('calculates 8% success fee for eligible purchase orders below cap', async () => {
    mockAttestation = {
      id: 'att_123',
      org_id: '10000000-0000-0000-0000-000000000002',
      amount_cents: 5000000, // $50,000 PO
      buyer: 'Lockheed Martin',
      status: 'submitted',
    };

    const res = await app.request('/attestations/att_123/accept', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-admin-token',
      },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { successFeeCents: number; poAmountCents: number };
    // 8% of $50,000 = $4,000 = 400,000 cents
    expect(body.successFeeCents).toBe(400000);
    expect(body.poAmountCents).toBe(5000000);
  });

  it('caps success fee at $8,000 (800,000 cents) for large enterprise POs', async () => {
    mockAttestation = {
      id: 'att_456',
      org_id: '10000000-0000-0000-0000-000000000002',
      amount_cents: 20000000, // $200,000 PO -> 8% would be $16,000
      buyer: 'Boeing Defense',
      status: 'submitted',
    };

    const res = await app.request('/attestations/att_456/accept', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-admin-token',
      },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { successFeeCents: number };
    // Must be capped at $8,000 = 800,000 cents per PRD v1.0
    expect(body.successFeeCents).toBe(800000);
  });
});
