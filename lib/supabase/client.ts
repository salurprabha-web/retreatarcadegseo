import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../types/supabase'

// This file creates a client-side Supabase client.
// In Next.js, client-side code accesses environment variables that are prefixed
// with NEXT_PUBLIC_. The next.config.mjs file is configured to map the
// Vercel-provided VITE_... variables to NEXT_PUBLIC_... variables.

export function createClient() {
  // Fix: Use process.env for client-side environment variables in Next.js, as `import.meta.env` is not standard and causes build errors.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error is thrown if the environment variables are not set.
    // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.
    // In this project, they are mapped from VITE_ variables in next.config.mjs.
    throw new Error("Supabase URL and/or Anon Key are not set in client-side environment variables. Check your project's environment configuration and next.config.mjs.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
