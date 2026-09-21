import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export type RouteGroup = 'public' | 'member' | 'partner' | 'operator' | 'admin';

/**
 * Explicit Route Group Classifier
 * Fixes critical route boundary defects:
 * 1. /apply is explicitly PUBLIC — never matched by /app prefix
 * 2. /packet, /targets, /intros, /scoreboard, /billing are protected as MEMBER routes
 * 3. /partner/* is protected as PARTNER routes
 * 4. /ops/* is protected as OPERATOR routes
 * 5. /admin/* is protected as ADMIN routes
 */
export function classifyRoute(pathname: string): RouteGroup {
  // 1. Explicit public intake & auth routes
  if (pathname === '/apply' || pathname.startsWith('/apply/')) {
    return 'public';
  }
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/login/')) {
    return 'public';
  }

  // 2. High-privilege command centers
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin';
  }
  if (pathname === '/ops' || pathname.startsWith('/ops/')) {
    return 'operator';
  }

  // 3. Partner portal
  if (pathname === '/partner' || pathname.startsWith('/partner/')) {
    return 'partner';
  }

  // 4. Member portal & tools
  if (
    pathname === '/app' || pathname.startsWith('/app/') ||
    pathname === '/packet' || pathname.startsWith('/packet/') ||
    pathname === '/targets' || pathname.startsWith('/targets/') ||
    pathname === '/intros' || pathname.startsWith('/intros/') ||
    pathname === '/scoreboard' || pathname.startsWith('/scoreboard/') ||
    pathname === '/billing' || pathname.startsWith('/billing/')
  ) {
    return 'member';
  }

  return 'public';
}

/**
 * Route-to-Role Matrix Authorization Guard
 * Evaluates server-controlled app_metadata (never unverified user_metadata)
 */
export function isAuthorized(group: RouteGroup, user: any): boolean {
  if (group === 'public') return true;
  if (!user) return false;

  const appMeta = user.app_metadata || {};
  const role = appMeta.role;
  const isInternal = appMeta.is_internal === true;
  const isAdmin = appMeta.is_admin === true || role === 'admin';
  const isOperator = isInternal || role === 'operator' || isAdmin;

  switch (group) {
    case 'admin':
      return isAdmin;
    case 'operator':
      return isOperator;
    case 'partner':
      return isAdmin || isInternal || role === 'partner';
    case 'member':
      // Any authenticated user belonging to a member tenant or internal staff
      return true;
    default:
      return false;
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const group = classifyRoute(pathname);

  // Unconditionally allow public routes
  if (group === 'public') {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // FAIL-CLOSED: If protected route is accessed but Supabase config is missing
  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'unconfigured');
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth token and verify user identity
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Authenticated check
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-gate check: enforce explicit route->role matrix
  if (!isAuthorized(group, user)) {
    const unauthorizedUrl = new URL('/app', request.url);
    unauthorizedUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(unauthorizedUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
