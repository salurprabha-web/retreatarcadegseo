import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// This application is a Next.js application.
// Client components access environment variables via `process.env`.
// Variable names must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.
// The `next.config.mjs` file handles remapping Vercel's `VITE_` variables to `NEXT_PUBLIC_`.
// See: https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables

export function createClient() {
  // Use `process.env` for client-side environment variables in a Next.js app.
  // Fix: Use process.env for Next.js client components instead of import.meta.env.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Fix: Use process.env for Next.js client components instead of import.meta.env.
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error will be thrown if the environment variables are not set.
    // Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your deployment environment (e.g., Vercel),
    // and correctly mapped in next.config.mjs.
    throw new Error("Supabase URL and/or Anon Key are not set in environment variables.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
