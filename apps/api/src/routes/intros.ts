import { Hono } from 'hono';
import { getSupabaseAdmin, mintSignedPacketUrl } from '../lib/supabase';
import { sendIntroEmail } from '../lib/resend';
import { writeAuditLog } from '../lib/audit';
import { requireAuth, requireOperatorOrAdmin, verifyOperatorForOrg } from '../lib/auth';

const intros = new Hono();

intros.use('/org/:orgId', requireAuth);
intros.get('/org/:orgId', async (c) => {
  const orgId = c.req.param('orgId');
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from('intros')
      .select(`
        id,
        org_id,
        channel,
        copy,
        approved_at,
        sent_at,
        result,
        people (
          id,
          name,
          role,
          email
        ),
        account_targets (
          id,
          name
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({ intros: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error listing intros';
    return c.json({ error: msg }, 500);
  }
});

intros.use('/:id/approve', requireAuth);
intros.post('/:id/approve', async (c) => {
  const introId = c.req.param('id');
  const user = c.get('user');
  const supabase = getSupabaseAdmin();

  try {
    const { data: intro, error: fetchError } = await supabase
      .from('intros')
      .select('id, org_id, approved_at')
      .eq('id', introId)
      .single();

    if (fetchError || !intro) {
      return c.json({ error: 'Introduction record not found' }, 404);
    }

    const approvedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('intros')
      .update({ approved_at: approvedAt })
      .eq('id', introId);

    if (updateError) throw updateError;

    await writeAuditLog({
      action: 'intro.copy_approved',
      entityType: 'intro',
      entityId: introId,
      meta: {
        approvedBy: user?.id,
        approvedAt,
      },
    });

    return c.json({ success: true, introId, approvedAt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error approving introduction';
    return c.json({ error: msg }, 500);
  }
});

intros.use('/:id/send', requireAuth);
intros.use('/:id/send', requireOperatorOrAdmin);

intros.post('/:id/send', async (c) => {
  const introId = c.req.param('id');
  const user = c.get('user');
  const supabase = getSupabaseAdmin();

  try {
    // 1. Fetch intro details with target and champion
    const { data: intro, error: introError } = await supabase
      .from('intros')
      .select(`
        id,
        org_id,
        channel,
        copy,
        approved_at,
        sent_at,
        result,
        people!inner (
          id,
          name,
          role,
          email,
          do_not_contact_until
        ),
        account_targets!inner (
          id,
          name
        )
      `)
      .eq('id', introId)
      .single();

    if (introError || !intro) {
      return c.json({ error: 'Introduction record not found' }, 404);
    }

    // Enforce organization-specific operator authorization
    if (user && !(await verifyOperatorForOrg(user, intro.org_id))) {
      return c.json({ error: 'Forbidden: You are not an assigned operator for this organization' }, 403);
    }

    // 2. Invariant: Member must have approved the copy before dispatch
    if (!intro.approved_at) {
      return c.json({
        error: 'Member approval required before dispatching introduction',
      }, 400);
    }

    // 3. Invariant: Packet must be 'ready' (not 'blocked')
    const { data: packet, error: packetError } = await supabase
      .from('packets')
      .select('id, status')
      .eq('org_id', intro.org_id)
      .single();

    if (packetError || !packet || packet.status !== 'ready') {
      return c.json({
        error: 'Cannot dispatch introduction while risk packet is blocked or incomplete',
      }, 400);
    }

    // 4. Invariant: Check 180-day do_not_contact_until cooldown on champion
    const champion = Array.isArray(intro.people) ? intro.people[0] : intro.people;
    if (champion.do_not_contact_until && new Date(champion.do_not_contact_until) > new Date()) {
      return c.json({
        error: `Champion is currently in active cooldown until ${champion.do_not_contact_until}`,
      }, 400);
    }

    // 5. Look for capability statement / packet artifact to mint signed URL
    let signedPacketUrl: string | null = null;
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('storage_path')
      .eq('packet_id', packet.id)
      .eq('kind', 'capability_statement')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (artifact?.storage_path) {
      signedPacketUrl = await mintSignedPacketUrl(artifact.storage_path, 86400); // 24h
    }

    // 6. Send email via Resend if email channel
    if (intro.channel === 'email' && champion.email) {
      await sendIntroEmail({
        toEmail: champion.email,
        championName: champion.name,
        introCopy: intro.copy,
        signedPacketUrl,
      });
    }

    // 7. Update intro status to 'sent'
    const sentAt = new Date().toISOString();
    await supabase
      .from('intros')
      .update({
        sent_at: sentAt,
        result: 'sent',
      })
      .eq('id', introId);

    // 8. Record audit log
    await writeAuditLog({
      action: 'intro.dispatched',
      entityType: 'intro',
      entityId: introId,
      meta: {
        operatorId: user?.id,
        championId: champion.id,
        championEmail: champion.email,
        packetUrlMinted: Boolean(signedPacketUrl),
      },
    });

    return c.json({
      success: true,
      introId,
      result: 'sent',
      sentAt,
      signedPacketUrlMinted: Boolean(signedPacketUrl),
    });
  } catch (err: unknown) {
    console.error('[Intros] Error dispatching introduction:', err);
    const msg = err instanceof Error ? err.message : 'Error sending introduction';
    return c.json({ error: msg }, 500);
  }
});

export default intros;
