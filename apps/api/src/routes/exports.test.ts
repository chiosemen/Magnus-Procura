import { describe, it, expect, vi } from 'vitest';
import app from '../index';

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: '10000000-0000-0000-0000-000000000002',
                  name: 'Apex Industrial',
                  type: 'member',
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'intros' || table === 'account_targets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
}));

describe('Exports Route Security', () => {
  it('rejects unauthenticated export requests with 401', async () => {
    const res = await app.request('/exports/org/10000000-0000-0000-0000-000000000002', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to export organization data as zip archive', async () => {
    const res = await app.request('/exports/org/10000000-0000-0000-0000-000000000002', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-admin-token',
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/zip');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename=');
  });
});
