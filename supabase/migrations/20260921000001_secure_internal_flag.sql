-- Migration: 20260921000001_secure_internal_flag.sql
-- Description: Prevent non-admin users from escalating privileges by updating is_internal on public.profiles

-- 1. Drop existing permissive update policy on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Create hardened update policy: users can update own profile fields (e.g. name),
-- but CANNOT alter is_internal (enforces immutable is_internal on self-updates)
CREATE POLICY "Users can update own profile non_priv" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND 
        (is_internal = (SELECT p.is_internal FROM public.profiles p WHERE p.id = auth.uid()))
    );

-- 3. Only admins or service role can change is_internal
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- 4. Organization-specific operator check helper
CREATE OR REPLACE FUNCTION public.is_operator_for_org(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.operator_assignments
        WHERE profile_id = auth.uid()
          AND org_id = target_org_id
          AND active = true
    );
$$;

-- 5. Fix handle_new_user to NEVER trust user-supplied raw_user_meta_data for is_internal
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, is_internal)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE((NEW.raw_app_meta_data->>'is_internal')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

