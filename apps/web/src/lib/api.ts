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

  let token = options.token;
  if (!token && typeof window !== 'undefined') {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (err) {
      console.warn('[apiFetch] Could not retrieve Supabase session token:', err);
    }
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
