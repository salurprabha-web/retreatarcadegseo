import { supabase } from './supabase';

export async function getPublishedServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}

export async function getFeaturedServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(4);

  if (error) {
    console.error('Error fetching featured services:', error);
    return [];
  }

  return data || [];
}

export async function getServiceBySlug(slug: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data;
}
