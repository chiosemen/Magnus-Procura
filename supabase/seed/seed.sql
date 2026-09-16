-- Seed Data: supabase/seed/seed.sql
-- Development and Staging Seed for Magnus Procura

-- 1. Profiles
INSERT INTO public.profiles (id, full_name, email, is_internal)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Magnus Founder', 'founder@magnusprocura.com', true),
    ('00000000-0000-0000-0000-000000000002', 'Sarah Capture', 'operator@magnusprocura.com', true),
    ('00000000-0000-0000-0000-000000000003', 'Marcus Vance (Apex Owner)', 'owner@apexindustrial.com', false),
    ('00000000-0000-0000-0000-000000000004', 'Elena Rostova (Apex BD)', 'collab@apexindustrial.com', false),
    ('00000000-0000-0000-0000-000000000005', 'David Partner (SCA)', 'partner@supplychainalliance.org', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Organizations
INSERT INTO public.organizations (id, name, type, fit_score, status)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Magnus Internal', 'internal', 100, 'active'),
    ('10000000-0000-0000-0000-000000000002', 'Apex Industrial Solutions', 'member', 88, 'active'),
    ('10000000-0000-0000-0000-000000000003', 'Vanguard Facilities Group', 'member', 74, 'active'),
    ('10000000-0000-0000-0000-000000000004', 'Supply Chain Alliance', 'partner', 90, 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Organization Members
INSERT INTO public.org_members (org_id, profile_id, role)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'operator'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'owner'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'collaborator'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'referrer')
ON CONFLICT (org_id, profile_id) DO NOTHING;

-- 4. Operator Assignments
INSERT INTO public.operator_assignments (id, org_id, profile_id, active)
VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', true),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Programs
INSERT INTO public.programs (id, org_id, sku, starts_on, ends_on, attempts_owed, refund_until, status)
VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'year_1', NOW() - INTERVAL '20 days', NOW() + INTERVAL '345 days', 8, NOW() + INTERVAL '10 days', 'active'),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'sprint_90', NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days', 4, NOW() + INTERVAL '25 days', 'pending')
ON CONFLICT (id) DO NOTHING;

-- 6. Packets & Artifacts
INSERT INTO public.packets (id, org_id, status)
VALUES
    ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'ready'),
    ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'blocked')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.artifacts (id, packet_id, kind, storage_path, status)
VALUES
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'capability_statement', '10000000-0000-0000-0000-000000000002/cap_stmt.pdf', 'have'),
    ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'coi', '10000000-0000-0000-0000-000000000002/coi_cert.pdf', 'have'),
    ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'financials', '10000000-0000-0000-0000-000000000002/financials_3yr.pdf', 'have'),
    ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'coi', '', 'gap')
ON CONFLICT (id) DO NOTHING;

-- 7. Account Targets (5 Primary + 1 Bench for Apex)
INSERT INTO public.account_targets (id, org_id, name, tier, status, why_us, known_desk)
VALUES
    ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Lockheed Martin', 'primary', 'approached', 'Specialized composite tooling supplier with 99.8% on-time delivery.', 'Tactical Missiles Procurement Desk'),
    ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Boeing Defense', 'primary', 'met', 'ITAR certified machining partner with active Ariba registration.', 'Commercial Derivative Aircraft Category'),
    ('60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Northrop Grumman', 'primary', 'research', 'Payload shroud manufacturing capacity available Q4.', 'Aeronautics Systems Desk'),
    ('60000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'General Dynamics', 'primary', 'research', 'Land systems hydraulic assembly specialist.', 'Combat Systems Sourcing'),
    ('60000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Raytheon Technologies', 'primary', 'research', 'RF sensor housing precision casting.', 'Missiles & Defense Supply Management'),
    ('60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'BAE Systems', 'bench', 'research', 'Bench account for naval surface warfare hardware.', 'Platforms & Services')
ON CONFLICT (id) DO NOTHING;

-- 8. Named Champions (People)
INSERT INTO public.people (id, account_target_id, name, role, email)
VALUES
    ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Arthur Pendelton', 'Category Manager - Structural Components', 'a.pendelton@lockheed.example.com'),
    ('70000000-0000-0000-0000-000000000002', 'Brenda Miller', 'Supplier Diversity Director', 'b.miller@boeing.example.com')
ON CONFLICT (id) DO NOTHING;

-- 9. Intros (The Factory)
INSERT INTO public.intros (id, org_id, account_target_id, person_id, channel, copy, approved_at, sent_at, result)
VALUES
    (
        '80000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        '60000000-0000-0000-0000-000000000001',
        '70000000-0000-0000-0000-000000000001',
        'email',
        'Arthur, Apex Industrial Solutions is an ITAR-certified composite tooling supplier currently delivering 99.8% on-time for precision programs. May I share their two-page buyer-ready risk packet?',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '14 days',
        'sent'
    ),
    (
        '80000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        '60000000-0000-0000-0000-000000000002',
        '70000000-0000-0000-0000-000000000002',
        'email',
        'Brenda, Apex Industrial is registered in Boeing Ariba and meets all Tier-1 supplier diversity standards. Would you have 15 minutes next Tuesday to review their machining capacity?',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '9 days',
        'met'
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Opportunities & Attestation
INSERT INTO public.opportunities (id, org_id, account_target_id, kind, opened_at)
VALUES
    ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', 'RFP: Wing-Spar Assembly Tooling', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 11. Operator Hours (Tracking against 15h annual budget)
INSERT INTO public.operator_hours (id, org_id, profile_id, minutes, day, note)
VALUES
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 60, CURRENT_DATE - 15, 'Kickoff call & Top 5 account map agreement'),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 45, CURRENT_DATE - 12, 'Packet QA: Capability statement & COI review'),
    (gen_random_uuid(), '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 30, CURRENT_DATE - 9, 'Drafted and sent Lockheed Martin intro copy')
ON CONFLICT DO NOTHING;

-- 12. Cohort
INSERT INTO public.cohorts (id, name, started_on, is_publishable)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Cohort 1 (Founding)', '2026-09-01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cohort_members (cohort_id, org_id)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
    ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003')
ON CONFLICT (cohort_id, org_id) DO NOTHING;

-- 13. Partners & Bounties
INSERT INTO public.partners (id, org_id, bounty_cents, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 25000, 'active')
ON CONFLICT (id) DO NOTHING;
