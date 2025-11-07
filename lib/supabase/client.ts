import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// This application is a Next.js app. Client components need to access environment variables.
// In Next.js, client-side environment variables are accessed via `process.env`.
// Variable names must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.
// See: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

export function createClient() {
  // Fix: Use process.env for client-side environment variables in a Next.js app.
  // `import.meta.env` is for Vite and causes a TypeScript error in this context.
  // The `next.config.mjs` file maps the expected VITE_ variables to NEXT_PUBLIC_.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // This error will be thrown if the environment variables are not set.
    // Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured in your deployment environment (e.g., Vercel),
    // or that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set if remapping is used in next.config.mjs.
    throw new Error("Supabase URL and/or Anon Key are not set in environment variables.");
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
