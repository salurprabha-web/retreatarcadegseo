import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client for a Next.js application.
// Client-side code in Next.js accesses environment variables through `process.env`.
// Environment variables must be prefixed with `NEXT_PUBLIC_` to be exposed to the client.

export function createClient() {
  // In a Next.js app, client-side environment variables are accessed via `process.env`.
  // The variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in your
  // environment configuration (e.g., .env.local file or Vercel settings).
  // The next.config.mjs file might remap variables from other sources.
  // Fix: Use process.env.NEXT_PUBLIC_* for client-side environment variables in Next.js, not import.meta.env.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not correctly exposed
    // to the client-side build. Ensure your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
    // are set in your project's environment configuration.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Please check your project's environment configuration.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
