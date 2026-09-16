import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';

const attestations = new Hono();

attestations.post('/:id/accept', async (c) => {
  const attestationId = c.req.param('id');
  const supabase = getSupabaseAdmin();

  try {
    // 1. Fetch attestation
    const { data: attestation, error: attError } = await supabase
      .from('attestations')
      .select('id, org_id, amount_cents, buyer, status')
      .eq('id', attestationId)
      .single();

    if (attError || !attestation) {
      return c.json({ error: 'Attestation not found' }, 404);
    }

    if (attestation.status !== 'submitted') {
      return c.json({ error: `Attestation is already in state: ${attestation.status}` }, 400);
    }

    // 2. Calculate success fee: min(8% * amount, $8,000 cap = 800,000 cents)
    const rawFee = Math.floor(attestation.amount_cents * 0.08);
    const successFeeCents = Math.min(rawFee, 800000);

    // 3. Create success fee invoice (Net 15 tracked as due_at)
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 15);

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        org_id: attestation.org_id,
        kind: 'success',
        amount_cents: successFeeCents,
        due_at: dueAt.toISOString(),
        status: 'open',
      })
      .select('id')
      .single();

    if (invError) {
      throw invError;
    }

    // 4. Update attestation status to accepted
    await supabase
      .from('attestations')
      .update({ status: 'accepted' })
      .eq('id', attestationId);

    // 5. Write audit log
    await writeAuditLog({
      action: 'attestation.accepted',
      entityType: 'attestation',
      entityId: attestationId,
      meta: {
        poAmountCents: attestation.amount_cents,
        successFeeCents,
        invoiceId: invoice?.id,
        buyer: attestation.buyer,
      },
    });

    return c.json({
      success: true,
      attestationId,
      poAmountCents: attestation.amount_cents,
      successFeeCents,
      invoiceId: invoice?.id,
      dueAt: dueAt.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Attestations] Error accepting attestation:', err);
    const msg = err instanceof Error ? err.message : 'Error accepting attestation';
    return c.json({ error: msg }, 500);
  }
});

export default attestations;
