import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';
import { requireAuth, requireOperatorOrAdmin } from '../lib/auth';

const targets = new Hono();

targets.use('*', requireAuth);
targets.use('*', requireOperatorOrAdmin);

// GET /targets/org/:orgId
// List primary and bench targets for a member organization
targets.get('/org/:orgId', async (c) => {
  const orgId = c.req.param('orgId') ?? '';
  const supabase = getSupabaseAdmin();

  try {
    const { data: list, error } = await supabase
      .from('account_targets')
      .select(`
        id,
        org_id,
        name,
        tier,
        status,
        why_us,
        known_desk,
        do_not_hit,
        people (
          id,
          name,
          role,
          email,
          do_not_contact_until
        )
      `)
      .eq('org_id', orgId)
      .order('tier', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    const primary = (list || []).filter(t => t.tier === 'primary');
    const bench = (list || []).filter(t => t.tier === 'bench');

    return c.json({
      orgId,
      primaryCount: primary.length,
      benchCount: bench.length,
      primary,
      bench,
    });
  } catch (err: unknown) {
    console.error('[Targets] Error listing targets:', err);
    const msg = err instanceof Error ? err.message : 'Failed to list targets';
    return c.json({ error: msg }, 500);
  }
});

// POST /targets/:id/rotate
// Rotates an unresponsive/dead primary target out and promotes a bench target in
targets.post('/:id/rotate', async (c) => {
  const targetId = c.req.param('id') ?? '';
  const user = c.get('user');
  const supabase = getSupabaseAdmin();

  try {
    const body = await c.req.json().catch(() => ({}));
    const { promoteTargetId, killReason } = body;

    if (!promoteTargetId) {
      return c.json({ error: 'promoteTargetId is required to rotate target' }, 400);
    }

    // 1. Fetch outgoing target
    const { data: outgoingTarget, error: outError } = await supabase
      .from('account_targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (outError || !outgoingTarget) {
      return c.json({ error: 'Outgoing target not found' }, 404);
    }

    // 2. Fetch nominated bench target
    const { data: incomingTarget, error: inError } = await supabase
      .from('account_targets')
      .select('*')
      .eq('id', promoteTargetId)
      .single();

    if (inError || !incomingTarget) {
      return c.json({ error: 'Bench target to promote not found' }, 404);
    }

    // 3. Invariant: Targets must belong to the same organization
    if (outgoingTarget.org_id !== incomingTarget.org_id) {
      return c.json({ error: 'Targets must belong to the same organization' }, 400);
    }

    // 4. Invariant: Incoming target must be currently bench tier
    if (incomingTarget.tier !== 'bench') {
      return c.json({ error: 'Target to promote must currently be in bench tier' }, 400);
    }

    const orgId = outgoingTarget.org_id;

    // 5. Update outgoing target to dead status and bench tier
    const reasonText = killReason ? ` [Rotated: ${killReason}]` : ' [Rotated by operator]';
    const { error: updateOutError } = await supabase
      .from('account_targets')
      .update({
        status: 'dead',
        tier: 'bench',
        why_us: outgoingTarget.why_us ? `${outgoingTarget.why_us}${reasonText}` : reasonText.trim(),
      })
      .eq('id', targetId);

    if (updateOutError) throw updateOutError;

    // 6. Update incoming target to primary tier and research status
    const { error: updateInError } = await supabase
      .from('account_targets')
      .update({
        tier: 'primary',
        status: 'research',
      })
      .eq('id', promoteTargetId);

    if (updateInError) throw updateInError;

    // 7. Verify Invariant: Organization must not have more than 5 active primary targets
    const { count: primaryCount, error: countError } = await supabase
      .from('account_targets')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('tier', 'primary')
      .neq('status', 'dead');

    if (countError) throw countError;

    if (primaryCount && primaryCount > 5) {
      // Revert if cap violated
      await supabase.from('account_targets').update({ tier: 'bench', status: 'research' }).eq('id', promoteTargetId);
      await supabase.from('account_targets').update({ tier: outgoingTarget.tier, status: outgoingTarget.status }).eq('id', targetId);
      return c.json({ error: `Target cap invariant violation: Organization cannot exceed 5 active primary targets (found ${primaryCount})` }, 400);
    }

    // 8. Record audit log
    await writeAuditLog({
      action: 'target.rotated',
      entityType: 'account_target',
      entityId: targetId,
      meta: {
        orgId,
        demotedTargetId: targetId,
        demotedTargetName: outgoingTarget.name,
        promotedTargetId: promoteTargetId,
        promotedTargetName: incomingTarget.name,
        killReason: killReason || 'Unresponsive / operator rotation',
        operatorId: user?.id,
      },
    });

    return c.json({
      success: true,
      message: `Successfully rotated target: demoted '${outgoingTarget.name}', promoted '${incomingTarget.name}'`,
      demoted: { id: targetId, name: outgoingTarget.name, status: 'dead', tier: 'bench' },
      promoted: { id: promoteTargetId, name: incomingTarget.name, status: 'research', tier: 'primary' },
      activePrimaryCount: primaryCount,
    });
  } catch (err: unknown) {
    console.error('[Targets] Error rotating target:', err);
    const msg = err instanceof Error ? err.message : 'Target rotation failed';
    return c.json({ error: msg }, 500);
  }
});

export default targets;
