import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client.
// It is intended for a Next.js environment.

export function createClient() {
  // In a Next.js client-side component, environment variables must be prefixed
  // with NEXT_PUBLIC_ and are exposed on `process.env`.
  // The next.config.mjs file maps VITE_... to NEXT_PUBLIC_...
  // FIX: Use process.env.NEXT_PUBLIC_SUPABASE_URL for client-side variables in Next.js, as import.meta.env is not available.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // FIX: Use process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side variables in Next.js.
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