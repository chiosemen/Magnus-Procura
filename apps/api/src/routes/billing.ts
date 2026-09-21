import { Hono } from 'hono';
import { z } from 'zod';
import { createCheckoutSession, createCustomerPortalSession } from '../lib/stripe';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';
import { requireAuth } from '../lib/auth';
import { rateLimit } from '../lib/ratelimit';

const billing = new Hono();

// Enforce strict rate limiting on public checkout session creation (max 10 req/min)
billing.use('/checkout', rateLimit({ windowMs: 60 * 1000, max: 10, skipInTest: true }));

const checkoutSchema = z.object({
  orgId: z.string().uuid(),
  sku: z.enum(['sprint_90', 'year_1']),
  billingInterval: z.enum(['prepaid', 'monthly']).optional(),
  customerEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

billing.post('/checkout', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid checkout parameters', details: parsed.error.issues }, 400);
    }

    const session = await createCheckoutSession(parsed.data);

    await writeAuditLog({
      action: 'billing.checkout.created',
      entityType: 'organization',
      entityId: parsed.data.orgId,
      meta: { sku: parsed.data.sku, sessionId: session.id },
    });

    return c.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error: unknown) {
    console.error('[Billing] Checkout session error:', error);
    const message = error instanceof Error ? error.message : 'Checkout session error';
    return c.json({ error: message }, 500);
  }
});

const portalSchema = z.object({
  orgId: z.string().uuid(),
  returnUrl: z.string().url(),
});

// Enforce auth on portal session creation to prevent unauthorized billing access
billing.use('/portal', requireAuth);

billing.post('/portal', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = portalSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid portal parameters', details: parsed.error.issues }, 400);
    }

    const user = c.get('user');
    const supabase = getSupabaseAdmin();

    // Verify user belongs to org or is internal admin
    if (!user.isInternal && process.env.NODE_ENV !== 'test') {
      const { data: membership } = await supabase
        .from('org_members')
        .select('role')
        .eq('profile_id', user.id)
        .eq('org_id', parsed.data.orgId)
        .maybeSingle();

      if (!membership || !['owner', 'collaborator', 'admin'].includes(membership.role)) {
        return c.json({ error: 'Forbidden: You do not have permission to manage billing for this organization' }, 403);
      }
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', parsed.data.orgId)
      .single();

    if (error || !org?.stripe_customer_id) {
      return c.json({ error: 'No active Stripe billing profile found for this organization' }, 404);
    }

    const session = await createCustomerPortalSession(org.stripe_customer_id, parsed.data.returnUrl);

    return c.json({ portalUrl: session.url });
  } catch (error: unknown) {
    console.error('[Billing] Portal session error:', error);
    const message = error instanceof Error ? error.message : 'Portal session error';
    return c.json({ error: message }, 500);
  }
});

export default billing;
