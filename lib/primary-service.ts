/**
 * Index policy for product-in-city pages.
 *
 * One product can sit under several services, which makes several URLs for the same product in the
 * same city. They target the same search, so only ONE of them (the "primary") is the page Google
 * should rank; the others point their canonical address at it and stay out of the sitemap.
 *
 * Primary = among the services that have a published Auto Pages page for this product in this city
 * (or, if none, an enabled mapping), the one with the lowest display_order, then the shortest title.
 */
import { supabase } from '@/lib/supabase';

type Cand = { slug: string; display_order: number | null; title: string };

const pickPrimary = (c: Cand[]) =>
  [...c].sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999) || a.title.length - b.title.length || a.slug.localeCompare(b.slug))[0];

export async function getPrimaryServiceSlug(productId: string, locationId: string): Promise<string | null> {
  const { data: pages } = await supabase
    .from('product_location_pages')
    .select('services(slug, title, display_order, status, is_tech_service)')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .eq('status', 'published');
  let cands: Cand[] = ((pages as any[]) || [])
    .map((r) => r.services)
    .filter((s) => s && s.status === 'published' && !s.is_tech_service);

  if (!cands.length) {
    const { data: maps } = await supabase
      .from('service_location_products')
      .select('services!fk_service(slug, title, display_order, status, is_tech_service)')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .eq('is_enabled', true);
    cands = ((maps as any[]) || [])
      .map((r) => r.services)
      .filter((s) => s && s.status === 'published' && !s.is_tech_service);
  }
  return cands.length ? pickPrimary(cands).slug : null;
}
