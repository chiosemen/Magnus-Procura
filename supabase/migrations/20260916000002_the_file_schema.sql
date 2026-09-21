-- Migration: 20260916000002_the_file_schema.sql
-- Description: The File: packets, artifacts, account_targets, and people (champions)

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE packet_status AS ENUM ('ready', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE artifact_kind AS ENUM (
        'capability_statement', 
        'one_liner', 
        'naics_list', 
        'coi', 
        'financials', 
        'past_performance', 
        'portal_list', 
        'logo', 
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE artifact_status AS ENUM ('have', 'gap', 'waived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_tier AS ENUM ('primary', 'bench');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_status AS ENUM (
        'research', 
        'approached', 
        'accepted', 
        'declined', 
        'met', 
        'qualified', 
        'opp', 
        'dead'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS public.packets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
    status packet_status NOT NULL DEFAULT 'blocked',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    packet_id UUID NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
    kind artifact_kind NOT NULL,
    storage_path TEXT NOT NULL,
    status artifact_status NOT NULL DEFAULT 'gap',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tier target_tier NOT NULL DEFAULT 'primary',
    status target_status NOT NULL DEFAULT 'research',
    why_us TEXT,
    known_desk TEXT,
    do_not_hit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_target_id UUID NOT NULL REFERENCES public.account_targets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email CITEXT,
    do_not_contact_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for target lookup & champion contact gating
CREATE INDEX IF NOT EXISTS idx_account_targets_org_tier ON public.account_targets(org_id, tier);
CREATE INDEX IF NOT EXISTS idx_people_account_target ON public.people(account_target_id);
CREATE INDEX IF NOT EXISTS idx_people_do_not_contact ON public.people(do_not_contact_until) WHERE do_not_contact_until IS NOT NULL;

-- 3. Invariant Trigger: Enforce max 5 primary and 5 bench targets per organization
CREATE OR REPLACE FUNCTION public.trg_enforce_account_target_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- On UPDATE, if tier and org_id did not change, limit is unaffected
    IF TG_OP = 'UPDATE' AND OLD.tier = NEW.tier AND OLD.org_id = NEW.org_id THEN
        RETURN NEW;
    END IF;

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

