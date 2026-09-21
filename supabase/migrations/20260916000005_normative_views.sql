-- Migration: 20260916000005_normative_views.sql
-- Description: Normative SQL views encoding PRD business rules and funnel truth

-- 1. member_funnel: counts by stage for an organization
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
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active' AND NOW() > p.refund_until) AS kept90_count
FROM public.organizations o
LEFT JOIN public.intros i ON o.id = i.org_id
LEFT JOIN public.opportunities opp ON o.id = opp.org_id
LEFT JOIN public.attestations a ON o.id = a.org_id
LEFT JOIN public.programs p ON o.id = p.org_id
WHERE o.type = 'member'
GROUP BY o.id, o.name;

-- 2. programs_sla: SLA clock (attempts owed vs delivered vs paused)
CREATE OR REPLACE VIEW public.programs_sla WITH (security_invoker = true) AS
SELECT 
    p.id AS program_id,
    p.org_id,
    o.name AS org_name,
    p.sku,
    p.attempts_owed,
    COUNT(DISTINCT i.id) FILTER (
        WHERE i.result IN ('accepted', 'declined', 'no_response', 'met', 'no_show')
    ) AS attempts_delivered,
    p.starts_on,
    p.ends_on,
    p.refund_until,
    CASE 
        WHEN pkt.status = 'blocked' OR o.status IN ('unresponsive', 'paused') THEN true
        ELSE false
    END AS is_paused,
    pkt.status AS packet_status,
    o.status AS org_status
FROM public.programs p
JOIN public.organizations o ON p.org_id = o.id
LEFT JOIN public.packets pkt ON o.id = pkt.org_id
LEFT JOIN public.intros i ON o.id = i.org_id
GROUP BY p.id, p.org_id, o.name, p.sku, p.attempts_owed, p.starts_on, p.ends_on, p.refund_until, pkt.status, o.status;

-- 3. cohort_card: aggregate funnel and median days per cohort
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
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active' AND NOW() > p.refund_until) AS kept90_count
FROM public.cohorts c
LEFT JOIN public.cohort_members cm ON c.id = cm.cohort_id
LEFT JOIN public.intros i ON cm.org_id = i.org_id
LEFT JOIN public.opportunities opp ON cm.org_id = opp.org_id
LEFT JOIN public.attestations a ON cm.org_id = a.org_id
LEFT JOIN public.programs p ON cm.org_id = p.org_id
GROUP BY c.id, c.name, c.started_on, c.is_publishable;

-- 4. partner_scorecard: metrics per partner org
CREATE OR REPLACE VIEW public.partner_scorecard WITH (security_invoker = true) AS
SELECT 
    pt.id AS partner_id,
    o.name AS partner_name,
    pt.status,
    COUNT(DISTINCT r.id) AS referrals_sent,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result IN ('accepted', 'met')) AS accepted_count,
    COUNT(DISTINCT i.id) FILTER (WHERE i.result = 'met') AS met_count,
    COUNT(DISTINCT inv.id) FILTER (WHERE inv.status = 'paid') AS paid_count,
    COUNT(DISTINCT b.id) FILTER (WHERE b.paid_at IS NOT NULL AND b.clawed_at IS NULL) AS kept_count
FROM public.partners pt
JOIN public.organizations o ON pt.org_id = o.id
LEFT JOIN public.referrals r ON pt.id = r.partner_id
LEFT JOIN public.intros i ON r.resulting_org_id = i.org_id
LEFT JOIN public.invoices inv ON r.resulting_org_id = inv.org_id
LEFT JOIN public.bounties b ON r.id = b.referral_id
GROUP BY pt.id, o.name, pt.status;

-- 5. unit_econ_run: financial unit economics run per organization
CREATE OR REPLACE VIEW public.unit_econ_run WITH (security_invoker = true) AS
SELECT 
    o.id AS org_id,
    o.name AS org_name,
    COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.kind = 'program' AND inv.status = 'paid'), 0) AS program_fees_cents,
    COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.kind = 'success' AND inv.status = 'paid'), 0) AS success_fees_cents,
    COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.status = 'void'), 0) AS refund_cents,
    COALESCE(SUM(b.amount_cents) FILTER (WHERE b.paid_at IS NOT NULL AND b.clawed_at IS NULL), 0) AS bounty_cents,
    COALESCE(SUM(oh.minutes), 0) AS operator_minutes_logged,
    -- Loaded operator cost: $120/hr = $2/minute = 200 cents/minute
    COALESCE(SUM(oh.minutes) * 200, 0) AS operator_cogs_cents,
    -- Contribution margin = (Program Fees + Success Fees) - (Refunds + Bounties + Operator COGS)
    (
        COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.kind = 'program' AND inv.status = 'paid'), 0) +
        COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.kind = 'success' AND inv.status = 'paid'), 0) -
        COALESCE(SUM(inv.amount_cents) FILTER (WHERE inv.status = 'void'), 0) -
        COALESCE(SUM(b.amount_cents) FILTER (WHERE b.paid_at IS NOT NULL AND b.clawed_at IS NULL), 0) -
        COALESCE(SUM(oh.minutes) * 200, 0)
    ) AS contribution_margin_cents
FROM public.organizations o
LEFT JOIN public.invoices inv ON o.id = inv.org_id
LEFT JOIN public.referrals r ON o.id = r.resulting_org_id
LEFT JOIN public.bounties b ON r.id = b.referral_id
LEFT JOIN public.operator_hours oh ON o.id = oh.org_id
WHERE o.type = 'member'
GROUP BY o.id, o.name;
