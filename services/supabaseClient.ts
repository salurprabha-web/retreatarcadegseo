
// FIX: Removed reference to vite/client as it's not found in the environment, which was causing a type definition error.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Use environment variables for Supabase credentials.
// These need to be exposed to the client-side application.
// In Vercel, you would set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// FIX: Cast import.meta to any to access 'env' without Vite type definitions, resolving TypeScript errors.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL!;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY!;


if (!supabaseUrl || !supabaseAnonKey) {
    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = `
            <div style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #111827; color: #f87171; padding: 1rem;">
                <div style="max-width: 600px; text-align: center; border: 1px solid #ef4444; padding: 2rem; border-radius: 0.5rem;">
                    <h1 style="font-size: 1.5rem; font-weight: bold; color: #fecaca;">Configuration Error</h1>
                    <p style="margin-top: 1rem;">Supabase URL and Anon Key are not configured.</p>
                    <p style="margin-top: 0.5rem; color: #9ca3af; font-size: 0.875rem;">Please ensure you have set the <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> environment variables in your deployment settings or a local <code>.env</code> file.</p>
                </div>
            </div>
        `;
    }
    throw new Error('Supabase URL and Anon Key are required. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);