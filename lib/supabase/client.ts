import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client for a Next.js application.
// Client-side code in Next.js accesses environment variables through the `process.env` object.
// Environment variables must be prefixed with `NEXT_PUBLIC_` to be exposed to the client.

// Fix: Switched from Vite's `import.meta.env` to Next.js's `process.env` for client-side environment variables.
export function createClient() {
  // In Next.js, client-side environment variables are accessed via `process.env`.
  // The `next.config.mjs` file is configured to map Vercel's `VITE_...` variables
  // to `NEXT_PUBLIC_...` for client-side use.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not correctly exposed
    // to the client-side build. Ensure your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    // are set in your project's environment configuration (e.g., .env.local or Vercel settings).
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Please check your project's environment configuration.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}