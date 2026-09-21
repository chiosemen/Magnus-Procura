-- Migration: 20260921000003_ws4_truthful_reporting_and_atomic_rotation.sql
-- Description: Atomic target rotation RPC, Cartesian fan-out fix for unit_econ_run, and accurate 90-day retention for kept90_count

-- 0. programs.cancelled_at
--
-- The kept90_count logic below reads p.cancelled_at, but no migration ever
-- created that column: public.programs carries only a `status` enum. Applying
-- this migration to a real database therefore failed with
-- `column p.cancelled_at does not exist`, which went unnoticed because CI had
-- no database and matched migration text instead of executing it.
--
-- The column is added here rather than the predicate being rewritten against
-- `status`, because `status` records only that a program is cancelled, never
-- when. The retention rule needs the timestamp to distinguish a cancellation
-- inside the 90-day window from one after it.
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 1. Atomic Target Rotation RPC Function
-- Guarantees that target rotation (demote outgoing + promote incoming) occurs atomically
-- within a single transaction with FOR UPDATE locks.
CREATE OR REPLACE FUNCTION public.rotate_account_targets(
    p_outgoing_id UUID,
    p_incoming_id UUID,
    p_final_status VARCHAR(32),
    p_reason_text TEXT
)
RETURNS VOID AS $$
DECLARE
    v_out_org UUID;
    v_in_org UUID;
    v_in_tier VARCHAR(16);
    v_out_why TEXT;
BEGIN
    SELECT org_id, why_us INTO v_out_org, v_out_why
    FROM public.account_targets
    WHERE id = p_outgoing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Outgoing target not found';
    END IF;

    SELECT org_id, tier INTO v_in_org, v_in_tier
    FROM public.account_targets
    WHERE id = p_incoming_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bench target to promote not found';
    END IF;

    IF v_out_org != v_in_org THEN
        RAISE EXCEPTION 'Targets must belong to the same organization';
    END IF;

    IF v_in_tier != 'bench' THEN
        RAISE EXCEPTION 'Target to promote must currently be in bench tier';
    END IF;

    -- 1. Demote outgoing target
    UPDATE public.account_targets
    SET status = p_final_status,
        tier = 'bench',
        why_us = CASE WHEN v_out_why IS NOT NULL THEN v_out_why || p_reason_text ELSE TRIM(p_reason_text) END
    WHERE id = p_outgoing_id;

    -- 2. Promote incoming target to primary
    UPDATE public.account_targets
    SET tier = 'primary',
        status = 'research'
    WHERE id = p_incoming_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix unit_econ_run to eliminate Cartesian Fan-Out Multiplication
-- Pre-aggregates invoices, bounties, and operator hours in CTEs before joining to organizations.
CREATE OR REPLACE VIEW public.unit_econ_run WITH (security_invoker = true) AS
WITH inv_agg AS (
    SELECT 
        org_id,
        COALESCE(SUM(amount_cents) FILTER (WHERE kind = 'program' AND status = 'paid'), 0) AS program_fees_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE kind = 'success' AND status = 'paid'), 0) AS success_fees_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'void'), 0) AS refund_cents
    FROM public.invoices
    GROUP BY org_id
),
bounty_agg AS (
    SELECT 
        r.resulting_org_id AS org_id,
        COALESCE(SUM(b.amount_cents) FILTER (WHERE b.paid_at IS NOT NULL AND b.clawed_at IS NULL), 0) AS bounty_cents
    FROM public.bounties b
    JOIN public.referrals r ON b.referral_id = r.id
    GROUP BY r.resulting_org_id
),
hours_agg AS (
    SELECT 
        org_id,
        COALESCE(SUM(minutes), 0) AS operator_minutes_logged
    FROM public.operator_hours
    GROUP BY org_id
)
SELECT 
    o.id AS org_id,
    o.name AS org_name,
    COALESCE(inv.program_fees_cents, 0) AS program_fees_cents,
    COALESCE(inv.success_fees_cents, 0) AS success_fees_cents,
    COALESCE(inv.refund_cents, 0) AS refund_cents,
    COALESCE(bty.bounty_cents, 0) AS bounty_cents,
    COALESCE(hrs.operator_minutes_logged, 0) AS operator_minutes_logged,
    COALESCE(hrs.operator_minutes_logged * 200, 0) AS operator_cogs_cents,
    (
        COALESCE(inv.program_fees_cents, 0) +
        COALESCE(inv.success_fees_cents, 0) -
        COALESCE(inv.refund_cents, 0) -
        COALESCE(bty.bounty_cents, 0) -
        COALESCE(hrs.operator_minutes_logged * 200, 0)
    ) AS contribution_margin_cents
FROM public.organizations o
LEFT JOIN inv_agg inv ON o.id = inv.org_id
LEFT JOIN bounty_agg bty ON o.id = bty.org_id
LEFT JOIN hours_agg hrs ON o.id = hrs.org_id
WHERE o.type = 'member';

-- 3. Fix member_funnel kept90_count to verify 90-day retention
CREATE OR REPLACE VIEW public.member_funnel WITH (security_invoker = true) AS
SELECT 
    o.id AS org_id,
    o.name AS org_name,
    COUNT(DISTINCT i.id) FILTER (WHERE i.sent_at IS NOT NULL) AS sent_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result IN ('accepted', 'met')) AS accepted_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result = 'met') AS met_count,
    COUNT(DISTINCT opp.id) AS qualified_count,
    COUNT(DISTINCT opp.id) AS opportunity_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS po_count,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.status = 'active' 
          AND NOW() >= (p.starts_on + INTERVAL '90 days')
          AND (p.cancelled_at IS NULL OR p.cancelled_at >= (p.starts_on + INTERVAL '90 days'))
    ) AS kept90_count
FROM public.organizations o
LEFT JOIN public.intros i ON o.id = i.org_id
LEFT JOIN public.opportunities opp ON o.id = opp.org_id
LEFT JOIN public.attestations a ON o.id = a.org_id
LEFT JOIN public.programs p ON o.id = p.org_id
WHERE o.type = 'member'
GROUP BY o.id, o.name;

-- 4. Fix cohort_card kept90_count to verify 90-day retention
CREATE OR REPLACE VIEW public.cohort_card WITH (security_invoker = true) AS
SELECT 
    c.id AS cohort_id,
    c.name AS cohort_name,
    c.started_on,
    c.is_publishable,
    COUNT(DISTINCT cm.org_id) AS n,
    COUNT(DISTINCT i.id) FILTER (WHERE i.sent_at IS NOT NULL) AS sent_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result IN ('accepted', 'met')) AS accepted_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result = 'met') AS met_count,
    COUNT(DISTINCT opp.id) AS qualified_count,
    COUNT(DISTINCT opp.id) AS opp_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'accepted') AS po_count,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.status = 'active' 
          AND NOW() >= (p.starts_on + INTERVAL '90 days')
          AND (p.cancelled_at IS NULL OR p.cancelled_at >= (p.starts_on + INTERVAL '90 days'))
    ) AS kept90_count
FROM public.cohorts c
LEFT JOIN public.cohort_members cm ON c.id = cm.cohort_id
LEFT JOIN public.intros i ON cm.org_id = i.org_id
LEFT JOIN public.opportunities opp ON cm.org_id = opp.org_id
LEFT JOIN public.attestations a ON cm.org_id = a.org_id
LEFT JOIN public.programs p ON cm.org_id = p.org_id
GROUP BY c.id, c.name, c.started_on, c.is_publishable;
