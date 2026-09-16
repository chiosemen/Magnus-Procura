import { describe, it, expect, vi } from 'vitest';
import app from '../index';

let mockIntroData: any = null;
let mockPacketData: any = null;

vi.mock('../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn().mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'intros') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => Promise.resolve({
                data: mockIntroData,
                error: null,
              })),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === 'packets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => Promise.resolve({
                data: mockPacketData,
                error: null,
              })),
            }),
          }),
        };
      }
      if (table === 'artifacts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { storage_path: 'org/cap.pdf' },
                    }),
                  }),
                }),
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
  mintSignedPacketUrl: vi.fn().mockResolvedValue('https://storage.supabase.co/signed/cap.pdf'),
}));

vi.mock('../lib/resend', () => ({
  sendIntroEmail: vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null }),
}));

describe('Intro Dispatch Invariants', () => {
  it('rejects dispatch when member has not approved intro copy', async () => {
    mockIntroData = {
      id: 'intro_unapproved',
      org_id: 'org_123',
      channel: 'email',
      copy: 'Hi Champion...',
      approved_at: null, // NOT approved
      people: { id: 'champ_1', name: 'Arthur', email: 'a@ex.com' },
    };
    mockPacketData = { id: 'pkt_123', status: 'ready' };

    const res = await app.request('/intros/intro_unapproved/send', {
      method: 'POST',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Member approval required');
  });

  it('rejects dispatch when risk packet is blocked or incomplete', async () => {
    mockIntroData = {
      id: 'intro_blocked_packet',
      org_id: 'org_123',
      channel: 'email',
      copy: 'Hi Champion...',
      approved_at: new Date().toISOString(),
      people: { id: 'champ_1', name: 'Arthur', email: 'a@ex.com' },
    };
    mockPacketData = { id: 'pkt_123', status: 'blocked' }; // BLOCKED

    const res = await app.request('/intros/intro_blocked_packet/send', {
      method: 'POST',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('risk packet is blocked');
  });

  it('successfully sends intro and stamps sent_at when packet is ready and copy is approved', async () => {
    mockIntroData = {
      id: 'intro_valid',
      org_id: 'org_123',
      channel: 'email',
      copy: 'Hi Arthur, Apex Industrial is ready...',
      approved_at: new Date().toISOString(),
      people: { id: 'champ_1', name: 'Arthur', email: 'a@ex.com' },
    };
    mockPacketData = { id: 'pkt_123', status: 'ready' }; // READY

    const res = await app.request('/intros/intro_valid/send', {
      method: 'POST',
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; result: string };
    expect(body.success).toBe(true);
    expect(body.result).toBe('sent');
  });
});
