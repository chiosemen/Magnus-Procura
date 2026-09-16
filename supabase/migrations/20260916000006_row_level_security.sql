-- Migration: 20260916000006_row_level_security.sql
-- Description: Complete Row Level Security matrix and helper predicates per Tech Architecture §7

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.org_members om ON p.id = om.profile_id
        WHERE p.id = auth.uid() 
          AND (p.is_internal = true OR om.role = 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_operator(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.operator_assignments oa
        WHERE oa.profile_id = auth.uid() 
          AND oa.org_id = target_org_id 
          AND oa.active = true
    ) OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(target_org_id UUID, allowed_roles public.member_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.org_members om
        WHERE om.profile_id = auth.uid() 
          AND om.org_id = target_org_id 
          AND om.role = ANY(allowed_roles)
    );
$$;

-- 2. Enable & Force RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fit_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.account_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_targets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people FORCE ROW LEVEL SECURITY;
ALTER TABLE public.intros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intros FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners FORCE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.operator_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- 3. Policy Definitions

-- profiles: user can read own profile; internal staff can read all profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- organizations: members can read own org, operators read assigned orgs, partners read partner org
CREATE POLICY "Org select policy" ON public.organizations
    FOR SELECT USING (
        public.has_org_role(id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(id) OR
        public.has_org_role(id, ARRAY['referrer']::public.member_role[]) OR
        public.is_admin()
    );

-- org_members: members can read memberships in their orgs; admin can read/manage all
CREATE POLICY "Org members select policy" ON public.org_members
    FOR SELECT USING (
        profile_id = auth.uid() OR
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- packets: members of own org, assigned operator, admin
CREATE POLICY "Packets select policy" ON public.packets
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Packets mutate policy" ON public.packets
    FOR ALL USING (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- artifacts: members of own org, assigned operator, admin (soft-delete filtered)
CREATE POLICY "Artifacts select policy" ON public.artifacts
    FOR SELECT USING (
        (deleted_at IS NULL) AND (
            EXISTS (
                SELECT 1 FROM public.packets p
                WHERE p.id = packet_id AND (
                    public.has_org_role(p.org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
                    public.is_assigned_operator(p.org_id) OR
                    public.is_admin()
                )
            )
        )
    );

CREATE POLICY "Artifacts mutate policy" ON public.artifacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.packets p
            WHERE p.id = packet_id AND (
                public.has_org_role(p.org_id, ARRAY['owner']::public.member_role[]) OR
                public.is_assigned_operator(p.org_id) OR
                public.is_admin()
            )
        )
    );

-- account_targets & people: own org members, assigned operator, admin
CREATE POLICY "Account targets select policy" ON public.account_targets
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Account targets mutate policy" ON public.account_targets
    FOR ALL USING (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "People select policy" ON public.people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.account_targets at
            WHERE at.id = account_target_id AND (
                public.has_org_role(at.org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
                public.is_assigned_operator(at.org_id) OR
                public.is_admin()
            )
        )
    );

-- intros & opportunities: own org, assigned operator, admin
CREATE POLICY "Intros select policy" ON public.intros
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Intros mutate policy" ON public.intros
    FOR ALL USING (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Opportunities select policy" ON public.opportunities
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- attestations: owner write; collab read; assigned operator read; admin all
CREATE POLICY "Attestations select policy" ON public.attestations
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Attestations insert policy" ON public.attestations
    FOR INSERT WITH CHECK (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_admin()
    );

-- programs & invoices: owner read; operator assigned read; admin all
CREATE POLICY "Programs select policy" ON public.programs
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

CREATE POLICY "Invoices select policy" ON public.invoices
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- referrals: partner own rows; admin all
CREATE POLICY "Referrals select policy" ON public.referrals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.partners p
            WHERE p.id = partner_id AND public.has_org_role(p.org_id, ARRAY['referrer']::public.member_role[])
        ) OR public.is_admin()
    );

CREATE POLICY "Referrals insert policy" ON public.referrals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partners p
            WHERE p.id = partner_id AND public.has_org_role(p.org_id, ARRAY['referrer']::public.member_role[])
        ) OR public.is_admin()
    );

-- bounties: partner own after paid; admin all
CREATE POLICY "Bounties select policy" ON public.bounties
    FOR SELECT USING (
        (paid_at IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.referrals r
            JOIN public.partners p ON r.partner_id = p.id
            WHERE r.id = referral_id AND public.has_org_role(p.org_id, ARRAY['referrer']::public.member_role[])
        )) OR public.is_admin()
    );

-- operator_hours: operator own hours + admin
CREATE POLICY "Operator hours select policy" ON public.operator_hours
    FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY "Operator hours mutate policy" ON public.operator_hours
    FOR ALL USING (profile_id = auth.uid() OR public.is_admin());

-- audit_log: admin only
CREATE POLICY "Audit log select policy" ON public.audit_log
    FOR SELECT USING (public.is_admin());

-- fit_reviews: admin & assigned reviewer
CREATE POLICY "Fit reviews select policy" ON public.fit_reviews
    FOR SELECT USING (public.is_admin() OR reviewer_id = auth.uid());

-- stage_transitions: member own org, assigned operator, admin
CREATE POLICY "Stage transitions select policy" ON public.stage_transitions
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- events: member own org, assigned operator, admin
CREATE POLICY "Events select policy" ON public.events
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

-- partners: partner own org, admin
CREATE POLICY "Partners select policy" ON public.partners
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['referrer']::public.member_role[]) OR
        public.is_admin()
    );

-- operator_assignments: assigned operator, admin
CREATE POLICY "Operator assignments select policy" ON public.operator_assignments
    FOR SELECT USING (
        profile_id = auth.uid() OR
        public.is_admin()
    );

-- cohorts & cohort_members: authenticated users read; admin manage
CREATE POLICY "Cohorts select policy" ON public.cohorts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Cohort members select policy" ON public.cohort_members
    FOR SELECT USING (
        public.has_org_role(org_id, ARRAY['owner', 'collaborator']::public.member_role[]) OR
        public.is_admin()
    );

-- score_snapshots: admin & assigned operators
CREATE POLICY "Score snapshots select policy" ON public.score_snapshots
    FOR SELECT USING (
        public.is_assigned_operator(org_id) OR
        public.is_admin()
    );

