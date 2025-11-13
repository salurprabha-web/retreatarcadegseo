import { supabase } from './supabase';

// ✅ Fetch all published events
export async function getPublishedEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, slug, summary, price, image_url, category')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

// ✅ Fetch single event by slug
export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data;
}
