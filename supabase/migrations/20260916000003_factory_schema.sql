-- Migration: 20260916000003_factory_schema.sql
-- Description: The Factory: intros, stage_transitions, events, opportunities, attestations, and count rules

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE intro_result AS ENUM (
        'sent', 
        'accepted', 
        'declined', 
        'no_response', 
        'met', 
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attestation_status AS ENUM ('submitted', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS public.intros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_target_id UUID NOT NULL REFERENCES public.account_targets(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'email',
    copy TEXT NOT NULL,
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    result intro_result,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_intros_person_id_not_null CHECK (person_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.stage_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    source_id UUID,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_target_id UUID NOT NULL REFERENCES public.account_targets(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    buyer TEXT NOT NULL,
    evidence_path TEXT NOT NULL,
    status attestation_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Triggers & Invariants
-- Trigger to forbid promoting events to intros
CREATE OR REPLACE FUNCTION public.prevent_event_to_intro_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Invalid operation: Events are non-intro gatherings and can NEVER be mutated or promoted into intros without a valid named champion person_id created directly in the intro ledger.';
END;
$$;

-- Trigger to record stage transition on intro result update
CREATE OR REPLACE FUNCTION public.record_intro_stage_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (OLD.result IS DISTINCT FROM NEW.result) THEN
        INSERT INTO public.stage_transitions (org_id, from_stage, to_stage, source_id, at)
        VALUES (
            NEW.org_id,
            COALESCE(OLD.result::text, 'draft'),
            NEW.result::text,
            NEW.id,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intro_stage_transition ON public.intros;
CREATE TRIGGER trg_intro_stage_transition
    AFTER UPDATE ON public.intros
    FOR EACH ROW
    WHEN (OLD.result IS DISTINCT FROM NEW.result)
    EXECUTE FUNCTION public.record_intro_stage_transition();

-- Trigger to automatically set 180-day do_not_contact_until on people when intro is declined
CREATE OR REPLACE FUNCTION public.handle_intro_decline_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.result = 'declined' AND (OLD.result IS NULL OR OLD.result != 'declined')) THEN
        UPDATE public.people
        SET do_not_contact_until = NOW() + INTERVAL '180 days'
        WHERE id = NEW.person_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intro_decline_cooldown ON public.intros;
CREATE TRIGGER trg_intro_decline_cooldown
    AFTER UPDATE ON public.intros
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_intro_decline_cooldown();
