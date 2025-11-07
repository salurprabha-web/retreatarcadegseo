import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client for a Next.js application.
// Client-side code in Next.js accesses environment variables via `process.env`.
// To expose variables to the browser, they must be prefixed with `NEXT_PUBLIC_`.
// The environment variables are loaded from `.env` files and mapped in `next.config.mjs`.

export function createClient() {
  // Fix: Use process.env for client-side environment variables in Next.js.
  // The `NEXT_PUBLIC_` prefix is required to expose the variables to the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not set.
    // Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your deployment environment,
    // which are then mapped to NEXT_PUBLIC_ variables in next.config.mjs.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Check your .env file and next.config.mjs configuration.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
