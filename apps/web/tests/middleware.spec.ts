import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { classifyRoute, isAuthorized, middleware, type RouteGroup } from '../src/middleware';

describe('WS2: Route & Session Boundary — classifyRoute', () => {
  it('CRITICAL FIX: classifies /apply as public, never matching /app member portal', () => {
    expect(classifyRoute('/apply')).toBe('public');
    expect(classifyRoute('/apply/')).toBe('public');
    expect(classifyRoute('/apply?ref=partner1')).toBe('public');
  });

  it('classifies public landing and login routes as public', () => {
    expect(classifyRoute('/')).toBe('public');
    expect(classifyRoute('/login')).toBe('public');
    expect(classifyRoute('/login/')).toBe('public');
  });

  it('classifies member portal pages as member', () => {
    expect(classifyRoute('/app')).toBe('member');
    expect(classifyRoute('/app/overview')).toBe('member');
    expect(classifyRoute('/packet')).toBe('member');
    expect(classifyRoute('/targets')).toBe('member');
    expect(classifyRoute('/intros')).toBe('member');
    expect(classifyRoute('/scoreboard')).toBe('member');
    expect(classifyRoute('/billing')).toBe('member');
  });

  it('classifies partner portal routes as partner', () => {
    expect(classifyRoute('/partner')).toBe('partner');
    expect(classifyRoute('/partner/referrals')).toBe('partner');
    expect(classifyRoute('/partner/bounties')).toBe('partner');
  });

  it('classifies operator portal routes as operator', () => {
    expect(classifyRoute('/ops')).toBe('operator');
    expect(classifyRoute('/ops/orgs/123')).toBe('operator');
    expect(classifyRoute('/ops/sla')).toBe('operator');
    expect(classifyRoute('/ops/hours')).toBe('operator');
    expect(classifyRoute('/ops/intros')).toBe('operator');
  });

  it('classifies admin command center routes as admin', () => {
    expect(classifyRoute('/admin')).toBe('admin');
    expect(classifyRoute('/admin/audit')).toBe('admin');
    expect(classifyRoute('/admin/cohorts')).toBe('admin');
    expect(classifyRoute('/admin/economics')).toBe('admin');
  });
});

describe('WS2: Route-to-Role Matrix Authorization — isAuthorized', () => {
  const memberUser = {
    id: 'user-member-1',
    app_metadata: { role: 'member', is_internal: false },
  };

  const partnerUser = {
    id: 'user-partner-1',
    app_metadata: { role: 'partner', is_internal: false },
  };

  const operatorUser = {
    id: 'user-operator-1',
    app_metadata: { role: 'operator', is_internal: true },
  };

  const adminUser = {
    id: 'user-admin-1',
    app_metadata: { role: 'admin', is_admin: true, is_internal: true },
  };

  it('allows anonymous and all roles on public routes', () => {
    expect(isAuthorized('public', null)).toBe(true);
    expect(isAuthorized('public', memberUser)).toBe(true);
    expect(isAuthorized('public', partnerUser)).toBe(true);
    expect(isAuthorized('public', operatorUser)).toBe(true);
    expect(isAuthorized('public', adminUser)).toBe(true);
  });

  it('denies anonymous visitors on all protected route groups', () => {
    expect(isAuthorized('member', null)).toBe(false);
    expect(isAuthorized('partner', null)).toBe(false);
    expect(isAuthorized('operator', null)).toBe(false);
    expect(isAuthorized('admin', null)).toBe(false);
  });

  it('enforces member role boundary', () => {
    expect(isAuthorized('member', memberUser)).toBe(true);
    // Member cannot access operator or admin routes
    expect(isAuthorized('operator', memberUser)).toBe(false);
    expect(isAuthorized('admin', memberUser)).toBe(false);
    expect(isAuthorized('partner', memberUser)).toBe(false);
  });

  it('enforces partner role boundary', () => {
    expect(isAuthorized('partner', partnerUser)).toBe(true);
    // Partner cannot access operator or admin routes
    expect(isAuthorized('operator', partnerUser)).toBe(false);
    expect(isAuthorized('admin', partnerUser)).toBe(false);
  });

  it('enforces operator role boundary', () => {
    expect(isAuthorized('operator', operatorUser)).toBe(true);
    // Operator cannot access admin command center unless promoted
    expect(isAuthorized('admin', operatorUser)).toBe(false);
  });

  it('allows admin role across all surfaces', () => {
    expect(isAuthorized('member', adminUser)).toBe(true);
    expect(isAuthorized('partner', adminUser)).toBe(true);
    expect(isAuthorized('operator', adminUser)).toBe(true);
    expect(isAuthorized('admin', adminUser)).toBe(true);
  });
});

describe('WS2: Middleware Edge Execution & Fail-Closed Guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('FAIL-CLOSED: Unconfigured Supabase redirects protected routes to /login?error=unconfigured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Protected member route
    const reqMember = new NextRequest('http://localhost:3000/packet');
    const resMember = await middleware(reqMember);
    expect(resMember.status).toBe(307);
    expect(resMember.headers.get('location')).toContain('/login?error=unconfigured&returnUrl=%2Fpacket');

    // 2. Protected admin route
    const reqAdmin = new NextRequest('http://localhost:3000/admin/audit');
    const resAdmin = await middleware(reqAdmin);
    expect(resAdmin.status).toBe(307);
    expect(resAdmin.headers.get('location')).toContain('/login?error=unconfigured&returnUrl=%2Fadmin%2Faudit');

    // 3. Protected operator route
    const reqOps = new NextRequest('http://localhost:3000/ops/sla');
    const resOps = await middleware(reqOps);
    expect(resOps.status).toBe(307);
    expect(resOps.headers.get('location')).toContain('/login?error=unconfigured&returnUrl=%2Fops%2Fsla');
  });

  it('Unconfigured Supabase permits public routes without redirecting', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const reqApply = new NextRequest('http://localhost:3000/apply');
    const resApply = await middleware(reqApply);
    // Public routes must return next() (status 200) without redirect
    expect(resApply.status).toBe(200);

    const reqLanding = new NextRequest('http://localhost:3000/');
    const resLanding = await middleware(reqLanding);
    expect(resLanding.status).toBe(200);
  });
});
