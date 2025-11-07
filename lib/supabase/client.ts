import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

export function createClient() {
  // For client-side code in Next.js, environment variables must be prefixed
  // with NEXT_PUBLIC_ to be exposed to the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and/or Anon Key are not set in environment variables.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}