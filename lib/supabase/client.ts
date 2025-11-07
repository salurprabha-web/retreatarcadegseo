import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client for a Next.js application.
// Client-side code in a Next.js app accesses environment variables
// through the `process.env` object.

// The `next.config.mjs` file is configured to map `VITE_` variables
// to `NEXT_PUBLIC_` variables to be exposed to the browser.

export function createClient() {
  // Fix: Use process.env for client-side environment variables in Next.js,
  // not import.meta.env which is specific to bundlers like Vite.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not correctly exposed
    // to the client-side build. Ensure your hosting environment variables are
    // configured and prefixed with 'NEXT_PUBLIC_'.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Please check your project's environment configuration.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
