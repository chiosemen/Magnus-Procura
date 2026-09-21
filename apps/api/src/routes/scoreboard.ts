import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { requireAuth, requireOrgRole } from '../lib/auth';

const scoreboard = new Hono();

// Enforce auth on scoreboard routes
scoreboard.use('*', requireAuth);

// GET /scoreboard/org/:orgId
// Computes dynamic conversion metrics from canonical database rows and normative views
scoreboard.get(
  '/org/:orgId',
  requireOrgRole((c) => c.req.param('orgId') ?? '', ['owner', 'collaborator', 'admin']),
  async (c) => {
    const orgId = c.req.param('orgId') ?? '';
    const supabase = getSupabaseAdmin();

    try {
      // 1. Query normative SQL view member_funnel
      const { data: funnelRow, error } = await supabase
        .from('member_funnel')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();

      if (error) {
        console.warn('[Scoreboard] member_funnel view query error, falling back to direct tables:', error);
      }

      // If view is available, use normative counts; otherwise aggregate directly
      let sentCount = Number(funnelRow?.sent_count ?? 0);
      let acceptedCount = Number(funnelRow?.accepted_count ?? 0);
      let metCount = Number(funnelRow?.met_count ?? 0);
      let qualifiedCount = Number(funnelRow?.qualified_count ?? 0);
      let opportunityCount = Number(funnelRow?.opportunity_count ?? 0);
      let poCount = Number(funnelRow?.po_count ?? 0);
      let kept90Count = Number(funnelRow?.kept90_count ?? 0);

      if (!funnelRow) {
        // Fallback aggregation from direct canonical tables
        const [introsRes, oppsRes, attestRes, progRes] = await Promise.all([
          supabase.from('intros').select('id, sent_at, result').eq('org_id', orgId),
          supabase.from('opportunities').select('id').eq('org_id', orgId),
          supabase.from('attestations').select('id, status').eq('org_id', orgId),
          supabase.from('programs').select('id, status, refund_until').eq('org_id', orgId),
        ]);

        const intros = introsRes.data || [];
        sentCount = intros.filter((i) => Boolean(i.sent_at)).length;
        acceptedCount = intros.filter((i) => i.result === 'accepted' || i.result === 'met').length;
        metCount = intros.filter((i) => i.result === 'met').length;

        const opps = oppsRes.data || [];
        qualifiedCount = opps.length;
        opportunityCount = opps.length;

        const attestations = attestRes.data || [];
        poCount = attestations.filter((a) => a.status === 'accepted').length;

        const programs = progRes.data || [];
        kept90Count = programs.filter(
          (p) => p.status === 'active' && new Date() > new Date(p.refund_until)
        ).length;
      }

      // 2. Compute dynamic stage-to-stage conversion rates
      const sentToMetRate = sentCount > 0 ? (metCount / sentCount) * 100 : 0;
      const metToQualifiedRate = metCount > 0 ? (qualifiedCount / metCount) * 100 : 0;
      const poConversionRate = sentCount > 0 ? (poCount / sentCount) * 100 : 0;

      return c.json({
        orgId,
        funnel: {
          sent: sentCount,
          accepted: acceptedCount,
          met: metCount,
          qualified: qualifiedCount,
          opportunity: opportunityCount,
          poAwarded: poCount,
          kept90: kept90Count,
        },
        rates: {
          sentToMetRate: Number(sentToMetRate.toFixed(1)),
          metToQualifiedRate: Number(metToQualifiedRate.toFixed(1)),
          poConversionRate: Number(poConversionRate.toFixed(1)),
        },
        computedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('[Scoreboard] Error computing metrics:', err);
      const msg = err instanceof Error ? err.message : 'Failed to compute scoreboard metrics';
      return c.json({ error: msg }, 500);
    }
  }
);

export default scoreboard;
