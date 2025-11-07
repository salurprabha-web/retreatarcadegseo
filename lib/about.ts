import { supabase } from './supabase';

export async function getAboutPageContent() {
  const { data, error } = await supabase
    .from('about_page')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching about page:', error);
    return null;
  }

  return data;
}
