import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';

let mockTargets: Record<string, any> = {};
let mockPrimaryCount = 4;

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'account_targets') {
        return {
          select: vi.fn((_columns?: string, options?: any) => {
            if (options?.head && options?.count === 'exact') {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    neq: vi.fn().mockResolvedValue({
                      count: mockPrimaryCount,
                      error: null,
                    }),
                    not: vi.fn().mockResolvedValue({
                      count: mockPrimaryCount,
                      error: null,
                    }),
                  }),
                }),
              };
            }
            return {
              eq: vi.fn((_col: string, val: string) => ({
                single: vi.fn().mockImplementation(() => {
                  const tgt = mockTargets[val];
                  if (!tgt) {
                    return Promise.resolve({ data: null, error: { message: 'Not found' } });
                  }
                  return Promise.resolve({ data: tgt, error: null });
                }),
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: Object.values(mockTargets).filter((t: any) => t.org_id === val),
                    error: null,
                  }),
                }),
              })),
            };
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    }),
  }),
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://storage.supabase.co/signed/cap.pdf'),
}));

vi.mock('../lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('Target Rotation & Bench Promotion Engine', () => {
  beforeEach(() => {
    mockPrimaryCount = 4;
    mockTargets = {
      'tgt_primary_1': {
        id: 'tgt_primary_1',
        org_id: 'org_123',
        name: 'Ford Motor Company',
        tier: 'primary',
        status: 'approached',
        why_us: 'Automated tooling',
      },
      'tgt_bench_1': {
        id: 'tgt_bench_1',
        org_id: 'org_123',
        name: 'General Dynamics',
        tier: 'bench',
        status: 'research',
        why_us: 'Armor mounts',
      },
      'tgt_diff_org': {
        id: 'tgt_diff_org',
        org_id: 'org_999',
        name: 'Different Org Target',
        tier: 'bench',
        status: 'research',
      },
      'tgt_already_primary': {
        id: 'tgt_already_primary',
        org_id: 'org_123',
        name: 'Boeing',
        tier: 'primary',
        status: 'research',
      },
    };
  });

  it('rejects unauthenticated requests without authorization header', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      body: JSON.stringify({ promoteTargetId: 'tgt_bench_1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status).toBe(401);
  });

  it('rejects request if promoteTargetId is missing', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('promoteTargetId is required');
  });

  it('rejects rotation when outgoing target does not exist', async () => {
    const res = await app.request('/targets/tgt_nonexistent/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoteTargetId: 'tgt_bench_1' }),
    });

    expect(res.status).toBe(404);
  });

  it('rejects rotation when promoted target does not exist', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoteTargetId: 'tgt_nonexistent' }),
    });

    expect(res.status).toBe(404);
  });

  it('rejects rotation when targets belong to different organizations', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoteTargetId: 'tgt_diff_org' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('must belong to the same organization');
  });

  it('rejects rotation if nominated target is not in bench tier', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoteTargetId: 'tgt_already_primary' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('must currently be in bench tier');
  });

  it('successfully rotates target and promotes bench target with default exhausted status', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promoteTargetId: 'tgt_bench_1',
        killReason: 'Unresponsive after 3 pings',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.demoted.name).toBe('Ford Motor Company');
    expect(body.demoted.status).toBe('exhausted');
    expect(body.promoted.name).toBe('General Dynamics');
    expect(body.promoted.tier).toBe('primary');
  });

  it('allows explicit dead status rotation for disqualified targets', async () => {
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promoteTargetId: 'tgt_bench_1',
        killReason: 'Account disqualified',
        targetStatus: 'dead',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.demoted.status).toBe('dead');
  });

  it('rejects rotation if 5 primary target cap would be violated', async () => {
    mockPrimaryCount = 6; // Cap exceeded
    const res = await app.request('/targets/tgt_primary_1/rotate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promoteTargetId: 'tgt_bench_1' }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Target cap invariant violation');
  });
});
