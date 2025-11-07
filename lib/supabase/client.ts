import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This is a Next.js application.
// Client-side code accesses environment variables via `process.env`.
// Variable names must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.
// See: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables
// Note: next.config.mjs remaps VITE_... variables from Vercel to NEXT_PUBLIC_...

export function createClient() {
  // Fix: Use process.env for client-side environment variables in a Next.js app, not import.meta.env.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error will be thrown if the environment variables are not set.
    // Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your deployment environment.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
