import { supabase } from './supabase';

/** ✅ Get all published services */
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

/** ✅ Get featured (highlighted) services */
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

/** ✅ Get a single service by slug — includes related events */
export async function getServiceBySlug(slug: string) {
  const { data, error } = await supabase
    .from('services')
    .select(`
      id,
      title,
      slug,
      summary,
      description,
      image_url,
      price_from,
      highlights,
      gallery_images,
      meta_title,
      meta_description,
      meta_keywords,
      schema_json,
      related_event_ids
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data;
}
