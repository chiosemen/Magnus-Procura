-- Migration 008: In-App Do-Not-Serve Register & Target Exhausted Status (Sprint 11)

-- 1. Extend target_status enum with 'exhausted' for Day 30 QBR rotations
ALTER TYPE public.target_status ADD VALUE IF NOT EXISTS 'exhausted';

-- 2. Create public.do_not_serve blacklist register (FR-FIT-4)
CREATE TABLE IF NOT EXISTS public.do_not_serve (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL,
    domain TEXT,
    reason TEXT NOT NULL, -- 'bad_faith', 'unpaid', 'conflict', 'fraud', 'prior_violation'
    notes TEXT,
    flagged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Functional indexes for sub-millisecond intake checking
CREATE INDEX IF NOT EXISTS idx_do_not_serve_domain ON public.do_not_serve (LOWER(domain));
CREATE INDEX IF NOT EXISTS idx_do_not_serve_entity_name ON public.do_not_serve (LOWER(entity_name));

-- 4. Enable and force Row Level Security
ALTER TABLE public.do_not_serve ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.do_not_serve FORCE ROW LEVEL SECURITY;

-- 5. RLS Policies: Restricted to internal operations staff and service role
CREATE POLICY "Do not serve select policy" ON public.do_not_serve
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_internal = true
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Do not serve insert policy" ON public.do_not_serve
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_internal = true
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Do not serve update policy" ON public.do_not_serve
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_internal = true
        )
        OR auth.role() = 'service_role'
    );

CREATE POLICY "Do not serve delete policy" ON public.do_not_serve
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_internal = true
        )
        OR auth.role() = 'service_role'
    );
