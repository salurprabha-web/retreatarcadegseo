// lib/supabase-admin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

export function getAdminSupabase() {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // throw only when actually used; handlers will catch this and return 500 instead of crashing build
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  _adminClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _adminClient;
}
