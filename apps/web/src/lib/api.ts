import { createClient } from './supabase/client';

export interface ApiFetchOptions extends RequestInit {
  token?: string;
}

/**
 * apiFetch performs an authenticated fetch request to the Magnus Procura API backend.
 * It retrieves the active Supabase session token and injects
 * the `Authorization: Bearer <access_token>` header.
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const url = path.startsWith('http') ? path : `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  // The caller may pass an absolute URL. Never attach the user's session token
  // to a host that is not our own API: a single call site built from a
  // server-supplied value would otherwise leak the bearer token to a third
  // party. Resolve both origins and compare before deciding to authenticate.
  let isTrustedOrigin: boolean;
  try {
    isTrustedOrigin = new URL(url, apiUrl).origin === new URL(apiUrl).origin;
  } catch {
    isTrustedOrigin = false;
  }

  let token = options.token;
  if (!token && isTrustedOrigin && typeof window !== 'undefined') {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (err) {
      console.warn('[apiFetch] Could not retrieve Supabase session token:', err);
    }
  }

  const headers = new Headers(options.headers || {});
  if (token && isTrustedOrigin && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
