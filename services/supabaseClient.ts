import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://kjzocarmvmpdsewaodxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqem9jYXJtdm1wZHNld2FvZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTkzNzQsImV4cCI6MjA3NjY3NTM3NH0.pa-fFtThHGgVWdQkiidh9wrTlOttexzqRpL8zKuPjE4';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
