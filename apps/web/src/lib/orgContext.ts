import { createClient } from './supabase/client';

export const DEFAULT_DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * getActiveOrgId retrieves the active tenant organization ID dynamically:
 * 1. Checks URL query parameter ?orgId=
 * 2. Checks active Supabase session user app_metadata.org_id
 * 3. Queries org_members for the authenticated user
 * 4. Falls back to default demo org ID in local dev/demo mode
 */
export async function getActiveOrgId(): Promise<string> {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const paramOrgId = urlParams.get('orgId');
    if (paramOrgId) return paramOrgId;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appMetaOrgId = session.user.app_metadata?.org_id;
        if (appMetaOrgId) return appMetaOrgId;

        // Query org_members for tenant association
        const { data: memberRows } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('profile_id', session.user.id)
          .limit(1);

        if (memberRows && memberRows.length > 0 && memberRows[0]?.org_id) {
          return memberRows[0].org_id;
        }
      }
    } catch (err) {
      console.warn('[getActiveOrgId] Failed to resolve tenant from session:', err);
    }
  }

  return DEFAULT_DEMO_ORG_ID;
}
