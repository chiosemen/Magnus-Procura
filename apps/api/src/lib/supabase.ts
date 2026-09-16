import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_dummy_service_role_key';

let adminClient: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!adminClient) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
      console.warn('[API] SUPABASE_SERVICE_ROLE_KEY is not set. Service-role operations will fail in production.');
    }
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
};

/**
 * Mints a 24-hour time-to-live signed URL for an artifact in the private 'packets' bucket
 */
export const mintSignedPacketUrl = async (
  storagePath: string,
  expiresInSeconds: number = 86400 // 24 hours
): Promise<string | null> => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('packets')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      console.error('[Storage] Error creating signed URL for packet:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('[Storage] Unexpected error creating signed URL:', err);
    return null;
  }
};
