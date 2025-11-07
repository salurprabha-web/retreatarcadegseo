import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client for a Next.js application.
// It uses `process.env` to access environment variables.

export function createClient() {
  // For a Next.js client-side component, environment variables must be prefixed with
  // NEXT_PUBLIC_ and are exposed on `process.env`.
  // The variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set
  // in your environment configuration (e.g., .env.local file or Vercel settings).
  // Fix: Use process.env for Next.js client-side environment variables.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Fix: Use process.env for Next.js client-side environment variables.
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the NEXT_PUBLIC_ prefixed environment variables are not correctly
    // set or exposed to the client-side build.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Please check your project's environment configuration.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
