import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';
import { requireAuth, requireOperatorOrAdmin } from '../lib/auth';

const fit = new Hono();

/**
 * Normalizes a web domain by trimming, lowercasing, and stripping protocols/paths/www.
 */
export function normalizeDomain(rawDomain?: string | null): string | null {
  if (!rawDomain) return null;
  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.split('/')[0].split('?')[0].split(':')[0].trim();
  return domain || null;
}

// POST /fit/check-blacklist
// Public/intake endpoint: Checks applicant domain or entity name against public.do_not_serve
fit.post('/check-blacklist', async (c) => {
  const supabase = getSupabaseAdmin();

  try {
    const body = await c.req.json().catch(() => ({}));
    const rawDomain = body.domain;
    const rawName = body.entityName;

    const domain = normalizeDomain(rawDomain);
    const entityName = rawName ? String(rawName).trim() : null;

    if (!domain && !entityName) {
      return c.json({ error: 'At least one of domain or entityName is required for blacklist verification' }, 400);
    }

    let match: any = null;

    // 1. Check domain match first (exact or subdomain match)
    if (domain) {
      const { data: domainMatches, error: domainError } = await supabase
        .from('do_not_serve')
        .select('id, entity_name, domain, reason, notes, created_at')
        .ilike('domain', domain)
        .limit(1);

      if (domainError) throw domainError;
      if (domainMatches && domainMatches.length > 0) {
        match = domainMatches[0];
      }
    }

    // 2. If no domain match, check entity name match
    if (!match && entityName) {
      const { data: nameMatches, error: nameError } = await supabase
        .from('do_not_serve')
        .select('id, entity_name, domain, reason, notes, created_at')
        .ilike('entity_name', entityName)
        .limit(1);

      if (nameError) throw nameError;
      if (nameMatches && nameMatches.length > 0) {
        match = nameMatches[0];
      }
    }

    const isBlacklisted = Boolean(match);

    return c.json({
      blacklisted: isBlacklisted,
      match: isBlacklisted ? {
        id: match.id,
        entityName: match.entity_name,
        domain: match.domain,
        reason: match.reason,
        notes: match.notes,
        createdAt: match.created_at,
      } : null,
    });
  } catch (err: unknown) {
    console.error('[Fit] Error checking blacklist:', err);
    const msg = err instanceof Error ? err.message : 'Blacklist check failed';
    return c.json({ error: msg }, 500);
  }
});

// GET /fit/blacklist
// Operator endpoint: Lists all active entries in the do-not-serve register
fit.get('/blacklist', requireAuth, requireOperatorOrAdmin, async (c) => {
  const supabase = getSupabaseAdmin();

  try {
    const { data: list, error } = await supabase
      .from('do_not_serve')
      .select(`
        id,
        entity_name,
        domain,
        reason,
        notes,
        flagged_by,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return c.json({
      count: list?.length || 0,
      entries: list || [],
    });
  } catch (err: unknown) {
    console.error('[Fit] Error fetching blacklist:', err);
    const msg = err instanceof Error ? err.message : 'Failed to retrieve blacklist';
    return c.json({ error: msg }, 500);
  }
});

// POST /fit/blacklist
// Operator endpoint: Enrolls a new bad-faith, conflicted, or non-paying entity into do-not-serve
fit.post('/blacklist', requireAuth, requireOperatorOrAdmin, async (c) => {
  const user = c.get('user');
  const supabase = getSupabaseAdmin();

  try {
    const body = await c.req.json().catch(() => ({}));
    const { entityName, domain: rawDomain, reason, notes } = body;

    if (!entityName || !reason) {
      return c.json({ error: 'entityName and reason are required to blacklist an entity' }, 400);
    }

    const domain = normalizeDomain(rawDomain);

    const { data: inserted, error } = await supabase
      .from('do_not_serve')
      .insert({
        entity_name: String(entityName).trim(),
        domain,
        reason: String(reason).trim(),
        notes: notes ? String(notes).trim() : null,
        flagged_by: user?.id || null,
      })
      .select('id, entity_name, domain, reason, notes, created_at')
      .single();

    if (error) throw error;

    await writeAuditLog({
      action: 'fit.entity_blacklisted',
      entityType: 'do_not_serve',
      entityId: inserted.id,
      meta: {
        entityName: inserted.entity_name,
        domain: inserted.domain,
        reason: inserted.reason,
        operatorId: user?.id,
      },
    });

    return c.json({
      success: true,
      message: `Entity '${inserted.entity_name}' successfully added to do-not-serve blacklist`,
      entry: inserted,
    }, 201);
  } catch (err: unknown) {
    console.error('[Fit] Error adding to blacklist:', err);
    const msg = err instanceof Error ? err.message : 'Failed to add entity to blacklist';
    return c.json({ error: msg }, 500);
  }
});

export default fit;
