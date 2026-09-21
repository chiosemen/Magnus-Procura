-- Supabase-compatible shim so production migrations can be applied and exercised
-- against a vanilla PostgreSQL instance in CI.
--
-- This file creates ONLY the platform surface that Supabase normally provides
-- (the auth schema, auth.uid()/auth.role(), and the anon/authenticated/service_role
-- roles). It must never create application tables: those come from the real
-- migrations in supabase/migrations/, unmodified.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE SCHEMA IF NOT EXISTS auth;

-- Supabase's auth.users. Only the columns our migrations touch are modelled.
CREATE TABLE IF NOT EXISTS auth.users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data  JSONB DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auth.uid() and auth.role() read the request-scoped JWT claims. We emulate the
-- GUCs Supabase sets per request so tests can impersonate a given user.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

-- Supabase's standard roles.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;

-- Application owner role. Supabase's `postgres` role is NOSUPERUSER + BYPASSRLS,
-- NOT a superuser. Migrations are applied as this role so that SECURITY DEFINER
-- helpers (public.is_admin(), public.is_operator_for_org(), ...) are owned by a
-- BYPASSRLS-but-not-superuser role exactly as they are in production. Running
-- migrations as a superuser instead would mask RLS recursion defects.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'magnus_owner') THEN
        CREATE ROLE magnus_owner NOSUPERUSER BYPASSRLS;
    END IF;
END
$$;

GRANT ALL ON SCHEMA public, auth TO magnus_owner;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO magnus_owner;

-- Least privilege for request-scoped roles: they get DML only, never DDL.
-- RLS policies from the real migrations are what actually constrain them.
ALTER DEFAULT PRIVILEGES FOR ROLE magnus_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE magnus_owner IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;
