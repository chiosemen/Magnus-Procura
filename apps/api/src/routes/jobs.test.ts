import { describe, it, expect, vi } from 'vitest';
import app from '../index';

let mockProgramsData: any[] = [];
let mockIntrosData: any[] = [];

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'programs') {
        const progResult = { data: mockProgramsData, error: null };
        const progChain: any = {
          lte: vi.fn().mockResolvedValue(progResult),
          gt: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          then: (resolve: any) => Promise.resolve(progResult).then(resolve),
        };
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(progChain),
          }),
        };
      }
      if (table === 'intros') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  lt: vi.fn().mockResolvedValue({ data: mockIntrosData, error: null }),
                }),
                lt: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                contains: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'programs_sla') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            select: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      };
    }),
  }),
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://example.com/signed.pdf'),
}));

vi.mock('../lib/resend', () => ({
  sendSlaWarningEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_sla' }, error: null }),
  sendQbrDueEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_qbr' }, error: null }),
  sendCopyApprovalReminderEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_copy' }, error: null }),
}));

vi.mock('../lib/audit', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(true),
}));

describe('Cadence & SLA Cron Endpoints', () => {
  it('tick-qbr executes and dispatches notices for Day 30/60/90 programs', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

    mockProgramsData = [
      {
        id: 'prog_1',
        org_id: 'org_1',
        starts_on: thirtyOneDaysAgo,
        sku: 'year_1',
        organizations: { id: 'org_1', name: 'Apex Industrial Robotics', status: 'active' },
      },
    ];

    const res = await app.request('/jobs/tick-qbr', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.job).toBe('tick-qbr');
    expect(body.noticesSent).toBe(1);
    expect(body.dispatchedMilestones[0].milestone).toBe('Day 30');
    expect(body.dispatchedMilestones[0].orgName).toBe('Apex Industrial Robotics');
  });

  it('tick-sla runs copy approval reminders and silence checks', async () => {
    process.env.CRON_SECRET = 'test-secret';
    mockIntrosData = [
      {
        id: 'intro_pending',
        org_id: 'org_1',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        account_targets: { name: 'Ford' },
        people: { name: 'Michael Thornton' },
        organizations: { name: 'Apex Industrial Robotics' },
      },
    ];

    const res = await app.request('/jobs/tick-sla', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret' },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.job).toBe('tick-sla');
    expect(body.copyRemindersSent).toBe(1);
  });
});
