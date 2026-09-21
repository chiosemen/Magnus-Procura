import type { Context, Next } from 'hono';
import { getSupabaseAdmin } from './supabase';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  isInternal?: boolean;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthenticatedUser;
    userId: string;
  }
}

/**
 * Authentication Middleware
 * Validates Supabase JWT from Bearer header.
 * Supports test bypass tokens in test environment.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();

  // Test bypass for unit/integration tests
  if (process.env.NODE_ENV === 'test') {
    if (token.startsWith('test-') || token === 'mock-token') {
      const isInternal = token.includes('admin') || token.includes('internal') || token.includes('operator');
      c.set('userId', '00000000-0000-0000-0000-000000000001');
      c.set('user', {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@magnusprocura.com',
        isInternal,
      });
      return next();
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: 'Invalid or expired authorization token' }, 401);
    }

    // Check if user is marked as internal staff via server-controlled app_metadata or database profile
    // Note: NEVER trust user.user_metadata (client-writable during signup/update)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_internal')
      .eq('id', user.id)
      .maybeSingle();

    const isInternal = Boolean(
      (user.app_metadata && user.app_metadata['is_internal']) ||
      profile?.is_internal
    );

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      isInternal,
    };

    c.set('userId', user.id);
    c.set('user', authUser);

    return next();
  } catch (err: unknown) {
    console.error('[Auth] Token verification failed:', err);
    return c.json({ error: 'Authentication service unavailable' }, 503);
  }
}

/**
 * Organization Role Verification Middleware
 * Requires the authenticated user to be an internal admin or hold an allowed role in the org.
 */
export function requireOrgRole(getOrgId: (c: Context) => string, allowedRoles: string[]) {
  return async function orgRoleMiddleware(c: Context, next: Next) {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (user.isInternal) {
      return next(); // Admins bypass org membership checks
    }

    const orgId = getOrgId(c);
    if (!orgId) {
      return c.json({ error: 'Organization ID not found in request context' }, 400);
    }

    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const supabase = getSupabaseAdmin();

    // Check operator assignment
    const { data: assignment } = await supabase
      .from('operator_assignments')
      .select('id')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .eq('active', true)
      .maybeSingle();

    if (assignment) {
      return next();
    }

    // Check organization membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('profile_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (!membership || !allowedRoles.includes(membership.role)) {
      return c.json({ error: 'Forbidden: Insufficient privileges for this organization' }, 403);
    }

    return next();
  };
}

/**
 * Verifies that the authenticated user is internal staff or an active operator
 * assigned specifically to the given orgId.
 */
export async function verifyOperatorForOrg(user: AuthenticatedUser, orgId: string): Promise<boolean> {
  if (user.isInternal || process.env.NODE_ENV === 'test') {
    return true;
  }
  const supabase = getSupabaseAdmin();
  const { data: assignment } = await supabase
    .from('operator_assignments')
    .select('id')
    .eq('profile_id', user.id)
    .eq('org_id', orgId)
    .eq('active', true)
    .maybeSingle();

  return Boolean(assignment);
}

/**
 * Operator Guard scoped to a specific organization.
 */
export function requireOperatorForOrg(getOrgId: (c: Context) => string | Promise<string>) {
  return async function operatorForOrgMiddleware(c: Context, next: Next) {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (user.isInternal || process.env.NODE_ENV === 'test') {
      return next();
    }

    const orgId = await getOrgId(c);
    if (!orgId) {
      return c.json({ error: 'Organization ID not found in request context' }, 400);
    }

    const isAllowed = await verifyOperatorForOrg(user, orgId);
    if (!isAllowed) {
      return c.json({ error: 'Forbidden: You are not an assigned operator for this organization' }, 403);
    }

    return next();
  };
}

/**
 * Operator or Admin Guard Middleware
 * Enforces that caller is internal staff or an active operator.
 */
export async function requireOperatorOrAdmin(c: Context, next: Next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (user.isInternal || process.env.NODE_ENV === 'test') {
    return next();
  }

  const supabase = getSupabaseAdmin();
  const { data: assignments } = await supabase
    .from('operator_assignments')
    .select('id')
    .eq('profile_id', user.id)
    .eq('active', true)
    .limit(1);

  if (!assignments || assignments.length === 0) {
    return c.json({ error: 'Forbidden: Operator or Administrator privileges required' }, 403);
  }

  return next();
}
