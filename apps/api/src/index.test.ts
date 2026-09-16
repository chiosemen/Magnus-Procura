import { describe, it, expect, vi } from 'vitest';
import app from './index';

interface HealthResponse {
  status: string;
  service: string;
}

interface JobResponse {
  job: string;
  status: string;
}

let mockDbError: { message: string } | null = null;

vi.mock('./lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        limit: vi.fn().mockImplementation(() =>
          Promise.resolve({
            data: mockDbError ? null : [{ id: 'profile-1' }],
            error: mockDbError,
          })
        ),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://example.com/signed.pdf'),
}));

vi.mock('./lib/resend', () => ({
  sendSlaWarningEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_1' }, error: null }),
}));

describe('API Healthcheck & Cron Security', () => {
  it('returns 200 and healthy status on GET /health when database is responsive', async () => {
    mockDbError = null;
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthResponse;
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('magnus-procura-api');
  });

  it('returns 503 and unhealthy status on GET /health when database is degraded', async () => {
    mockDbError = { message: 'connection pool timeout' };
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    const body = (await res.json()) as HealthResponse;
    expect(body.status).toBe('unhealthy');
  });

  it('rejects unauthenticated cron job calls when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const res = await app.request('/jobs/tick-sla', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    expect(res.status).toBe(401);
  });

  it('accepts authenticated cron job calls', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const res = await app.request('/jobs/tick-sla', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as JobResponse;
    expect(body.job).toBe('tick-sla');
  });
});
