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

vi.mock('./lib/supabase', () => {
  const chainable = () => {
    const obj: any = {};
    obj.select = vi.fn().mockReturnValue(obj);
    obj.update = vi.fn().mockReturnValue(obj);
    obj.insert = vi.fn().mockResolvedValue({ data: null, error: null });
    obj.eq = vi.fn().mockReturnValue(obj);
    obj.neq = vi.fn().mockReturnValue(obj);
    obj.lt = vi.fn().mockReturnValue(obj);
    obj.lte = vi.fn().mockReturnValue(obj);
    obj.gt = vi.fn().mockReturnValue(obj);
    obj.gte = vi.fn().mockReturnValue(obj);
    obj.not = vi.fn().mockReturnValue(obj);
    obj.is = vi.fn().mockReturnValue(obj);
    obj.contains = vi.fn().mockReturnValue(obj);
    obj.limit = vi.fn().mockImplementation(() =>
      Promise.resolve({
        data: mockDbError ? null : [{ id: 'profile-1' }],
        error: mockDbError,
      })
    );
    obj.single = vi.fn().mockResolvedValue({ data: null, error: null });
    obj.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    obj.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
    return obj;
  };

  return {
    getSupabaseAdmin: vi.fn().mockReturnValue({
      from: vi.fn(() => chainable()),
    }),
    mintSignedPacketUrl: vi.fn().mockResolvedValue('https://example.com/signed.pdf'),
  };
});

vi.mock('./lib/resend', () => ({
  sendSlaWarningEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_1' }, error: null }),
  sendQbrDueEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_qbr' }, error: null }),
  sendCopyApprovalReminderEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_copy' }, error: null }),
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
