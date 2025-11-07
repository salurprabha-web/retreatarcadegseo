import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This is a Next.js application, and this file is for creating a client-side Supabase client.
// Client-side code accesses environment variables via `process.env.NEXT_PUBLIC_...`.
// These are configured in `next.config.mjs` to be exposed to the browser.
// See: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables

export function createClient() {
  // Fix: Use process.env for client-side environment variables in a Next.js app.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not set.
    // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured in your deployment environment.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}