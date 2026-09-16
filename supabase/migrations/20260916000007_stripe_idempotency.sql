-- Migration: 20260916000007_stripe_idempotency.sql
-- Description: Stripe webhook event idempotency ledger and RLS

CREATE TABLE IF NOT EXISTS public.stripe_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processed',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Enforcement
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events FORCE ROW LEVEL SECURITY;

CREATE POLICY "Stripe events admin only" ON public.stripe_events
    FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
