import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../index';

let mockBlacklist: Array<{
  id: string;
  entity_name: string;
  domain: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
}> = [];

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'do_not_serve') {
        return {
          select: vi.fn((_columns?: string) => ({
            ilike: vi.fn((field: string, val: string) => {
              const matches = mockBlacklist.filter((entry) => {
                if (field === 'domain') {
                  return entry.domain?.toLowerCase() === val.toLowerCase();
                }
                if (field === 'entity_name') {
                  return entry.entity_name.toLowerCase().includes(val.toLowerCase());
                }
                return false;
              });
              return {
                limit: vi.fn().mockResolvedValue({
                  data: matches,
                  error: null,
                }),
              };
            }),
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockBlacklist,
                error: null,
              }),
            }),
          })),
          insert: vi.fn((data: any) => ({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                const newRecord = {
                  id: 'dns_new_1',
                  ...data,
                  created_at: new Date().toISOString(),
                };
                mockBlacklist.push(newRecord);
                return Promise.resolve({ data: newRecord, error: null });
              }),
            }),
          })),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://storage.supabase.co/signed/cap.pdf'),
}));

vi.mock('../lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('Fit Blacklist & Do-Not-Serve Invariants (FR-FIT-4)', () => {
  beforeEach(() => {
    mockBlacklist = [
      {
        id: 'dns_1',
        entity_name: 'Apex Fraudulent Systems',
        domain: 'apexfraud.com',
        reason: 'bad_faith',
        notes: 'Submitted forged capability statements and failed payment',
        created_at: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'dns_2',
        entity_name: 'Conflicted Defense Sub',
        domain: 'conflictedsub.org',
        reason: 'conflict',
        notes: 'Direct commercial collision with Cohort 1 anchor member',
        created_at: '2026-08-15T00:00:00.000Z',
      },
    ];
  });

  it('rejects blacklist check if neither domain nor entityName is provided', async () => {
    const res = await app.request('/fit/check-blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('At least one of domain or entityName is required');
  });

  it('detects blacklisted domain and normalizes URL protocols/paths', async () => {
    const res = await app.request('/fit/check-blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'https://www.apexfraud.com/about-us' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.blacklisted).toBe(true);
    expect(body.match.entityName).toBe('Apex Fraudulent Systems');
    expect(body.match.reason).toBe('bad_faith');
  });

  it('detects blacklisted entity name when domain is omitted', async () => {
    const res = await app.request('/fit/check-blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityName: 'Conflicted Defense Sub' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.blacklisted).toBe(true);
    expect(body.match.reason).toBe('conflict');
  });

  it('returns blacklisted=false for clean applicants', async () => {
    const res = await app.request('/fit/check-blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'clean-enterprise.com', entityName: 'Clean Enterprise LLC' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.blacklisted).toBe(false);
    expect(body.match).toBeNull();
  });

  it('rejects unauthenticated attempts to enroll an entity on blacklist', async () => {
    const res = await app.request('/fit/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityName: 'Bad Actor Corp', reason: 'unpaid' }),
    });

    expect(res.status).toBe(401);
  });

  it('allows authenticated operators to add an entity to do-not-serve register', async () => {
    const res = await app.request('/fit/blacklist', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-operator-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entityName: 'Unpaid Default Inc',
        domain: 'https://unpaid-default.com',
        reason: 'unpaid',
        notes: 'Defaulted on annual membership invoice after 90 days',
      }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.entry.domain).toBe('unpaid-default.com');
    expect(body.entry.reason).toBe('unpaid');
  });
});
