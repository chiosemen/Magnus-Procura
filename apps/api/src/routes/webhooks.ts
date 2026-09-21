import { Hono } from 'hono';
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { getSupabaseAdmin } from '../lib/supabase';
import { writeAuditLog } from '../lib/audit';

const webhooks = new Hono();

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

webhooks.post('/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await c.req.text();
  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      console.error('[Webhooks] Stripe signature verification failed:', err);
      const msg = err instanceof Error ? err.message : 'Invalid signature';
      return c.json({ error: msg }, 400);
    }
  } else if (process.env.NODE_ENV === 'test') {
    // In local dev/testing without webhook secret configured
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }
  } else {
    // In production, reject unverified webhook calls
    console.error('[Webhooks] Missing STRIPE_WEBHOOK_SECRET or stripe-signature in production');
    return c.json({ error: 'Missing webhook signature or unconfigured secret' }, 400);
  }

  const supabase = getSupabaseAdmin();

  // 1. Idempotency Check
  try {
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      console.log(`[Webhooks] Duplicate Stripe event ${event.id} already processed. Skipping.`);
      return c.json({ received: true, duplicate: true }, 200);
    }

    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      status: 'processing',
    });
  } catch (err) {
    console.warn('[Webhooks] Could not check stripe_events idempotency table:', err);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id || (session.metadata?.org_id as string);
        const customerId = session.customer as string;
        const amountCents = session.amount_total || 0;
        const sku = session.metadata?.sku || 'year_1';

        if (orgId) {
          // 1. Update organization with Stripe Customer ID
          if (customerId) {
            await supabase
              .from('organizations')
              .update({ stripe_customer_id: customerId })
              .eq('id', orgId);
          }

          // 2. Activate or insert program row
          const startsOn = new Date();
          const endsOn = new Date();
          endsOn.setFullYear(startsOn.getFullYear() + 1);
          const refundUntil = new Date();
          refundUntil.setDate(startsOn.getDate() + 30); // 30-day refund window

          const attemptsOwed = sku === 'sprint_90' ? 4 : 8;

          await supabase.from('programs').upsert({
            org_id: orgId,
            sku,
            starts_on: startsOn.toISOString(),
            ends_on: endsOn.toISOString(),
            attempts_owed: attemptsOwed,
            refund_until: refundUntil.toISOString(),
            status: 'active',
          });

          // 3. Upsert invoice record
          await supabase.from('invoices').insert({
            org_id: orgId,
            kind: 'program',
            stripe_id: session.id,
            amount_cents: amountCents,
            paid_at: new Date().toISOString(),
            status: 'paid',
          });

          // 4. Record audit log
          await writeAuditLog({
            action: 'billing.checkout.completed',
            entityType: 'program',
            entityId: orgId,
            meta: { sku, amountCents, customerId, eventId: event.id },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const amountCents = invoice.amount_paid;

        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (org) {
          await supabase.from('invoices').insert({
            org_id: org.id,
            kind: 'program',
            stripe_id: invoice.id,
            amount_cents: amountCents,
            paid_at: new Date().toISOString(),
            status: 'paid',
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;

        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (org) {
          // Flip program to cancelled
          await supabase
            .from('programs')
            .update({ status: 'cancelled' })
            .eq('org_id', org.id);

          // Clawback any pending or paid bounties on this org's referral
          const { data: referral } = await supabase
            .from('referrals')
            .select('id')
            .eq('resulting_org_id', org.id)
            .single();

          if (referral) {
            await supabase
              .from('bounties')
              .update({ clawed_at: new Date().toISOString() })
              .eq('referral_id', referral.id);
          }

          await writeAuditLog({
            action: 'billing.charge.refunded',
            entityType: 'program',
            entityId: org.id,
            meta: { chargeId: charge.id, clawedReferralId: referral?.id },
          });
        }
        break;
      }

      default:
        console.log(`[Webhooks] Unhandled Stripe event: ${event.type}`);
    }

    // Mark event completed in idempotency ledger
    try {
      await supabase
        .from('stripe_events')
        .update({ status: 'completed' })
        .eq('id', event.id);
    } catch {
      // Non-blocking
    }

    return c.json({ received: true });
  } catch (err: unknown) {
    console.error('[Webhooks] Error handling event:', err);
    const msg = err instanceof Error ? err.message : 'Webhook handler error';
    return c.json({ error: msg }, 500);
  }
});

webhooks.post('/resend', async (c) => {
  // Resend webhook secret authentication: Fail-Closed & Constant-Time Verification
  const authHeader = c.req.header('Authorization');
  const tokenHeader = c.req.header('x-resend-signature') || c.req.header('x-resend-token');
  const expectedSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (process.env.NODE_ENV !== 'test') {
    if (!expectedSecret) {
      console.error('[Webhooks] Missing RESEND_WEBHOOK_SECRET in production. Rejecting unverified webhook.');
      return c.json({ error: 'Missing webhook signature or unconfigured secret' }, 401);
    }

    const bearerToken = authHeader?.replace('Bearer ', '').trim();
    const isBearerValid = bearerToken ? timingSafeEqualStr(bearerToken, expectedSecret) : false;
    const isTokenValid = tokenHeader ? timingSafeEqualStr(tokenHeader, expectedSecret) : false;

    if (!isBearerValid && !isTokenValid) {
      return c.json({ error: 'Unauthorized: Invalid Resend webhook secret' }, 401);
    }
  }

  try {
    const payload = await c.req.json();
    const eventType = payload.type;
    const recipient = payload.data?.to?.[0] || payload.data?.email;

    console.log(`[Webhooks] Resend event: ${eventType} for ${recipient}`);

    if (eventType === 'email.bounced' || eventType === 'email.complained') {
      if (recipient) {
        const supabase = getSupabaseAdmin();
        // Automatically suppress champion in people table to protect deliverability
        await supabase
          .from('people')
          .update({ do_not_contact_until: '2099-12-31T23:59:59Z' })
          .eq('email', recipient.toLowerCase().trim());

        await writeAuditLog({
          action: 'resend.email.suppressed',
          entityType: 'people',
          entityId: recipient,
          meta: { reason: eventType, payload },
        });
      }
    }

    return c.json({ received: true, event: eventType });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Resend webhook error';
    return c.json({ error: msg }, 500);
  }
});

export default webhooks;
