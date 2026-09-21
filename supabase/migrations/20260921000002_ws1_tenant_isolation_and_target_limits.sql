-- Migration: 20260921000002_ws1_tenant_isolation_and_target_limits.sql
-- Description: Enforce security_invoker on all SQL views to prevent RLS bypass, and harden 5+5 target cap trigger on INSERT OR UPDATE

-- 1. Enforce security_invoker = true on all five normative SQL views
-- Without security_invoker = true, views execute with owner (BYPASSRLS) permissions,
-- leaking multi-tenant rows to unauthorized callers.
ALTER VIEW public.member_funnel SET (security_invoker = true);
ALTER VIEW public.programs_sla SET (security_invoker = true);
ALTER VIEW public.cohort_card SET (security_invoker = true);
ALTER VIEW public.partner_scorecard SET (security_invoker = true);
ALTER VIEW public.unit_econ_run SET (security_invoker = true);

-- 2. Invariant Trigger Hardening: Enforce max 5 primary and 5 bench targets per organization
-- Previously, trg_enforce_account_target_limits only fired BEFORE INSERT.
-- An attacker could insert 5 primary + 1 bench target, then UPDATE the bench target to primary,
-- bypassing the cap and producing 6 primary targets.
CREATE OR REPLACE FUNCTION public.trg_enforce_account_target_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- On UPDATE, if tier and org_id did not change, limit is unaffected
    IF TG_OP = 'UPDATE' AND OLD.tier = NEW.tier AND OLD.org_id = NEW.org_id THEN
        RETURN NEW;
    END IF;

    -- Count existing targets in the target tier, excluding the row being updated
    SELECT COUNT(*) INTO current_count
    FROM public.account_targets
    WHERE org_id = NEW.org_id 
      AND tier = NEW.tier
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    IF current_count >= 5 THEN
        RAISE EXCEPTION 'Organization cannot exceed 5 % targets', NEW.tier;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_account_target_limits_trg ON public.account_targets;
CREATE TRIGGER enforce_account_target_limits_trg
    BEFORE INSERT OR UPDATE ON public.account_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enforce_account_target_limits();
