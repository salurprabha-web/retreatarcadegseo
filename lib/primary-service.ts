/**
 * Index policy for product-in-city pages.
 *
 * One product can sit under several services, which makes several URLs for the same product in the
 * same city. They target the same search, so only ONE of them (the "primary") is the page Google
 * should rank; the others point their canonical address at it and stay out of the sitemap.
 *
 * Primary = among the services that have a published Auto Pages page for this product in this city
 * (or, if none, an enabled mapping), the best name match for the product (see lib/primary-pick.ts).
 */
import { supabase } from '@/lib/supabase';
import { choosePrimary } from '@/lib/primary-pick';

const ok = (s: any) => s && s.status === 'published' && !s.is_tech_service;

/** Only looks at pages that have their own approved text. Null when there are none. */
export async function getGeneratedPrimarySlug(productId: string, locationId: string, productTitle: string, cityName = ''): Promise<string | null> {
  const { data: pages } = await supabase
    .from('product_location_pages')
    .select('services(slug, title, display_order, status, is_tech_service)')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .eq('status', 'published');
  const cands = ((pages as any[]) || []).map((r) => r.services).filter(ok);
  return choosePrimary(cands, productTitle, cityName)?.slug ?? null;
}

export async function getPrimaryServiceSlug(productId: string, locationId: string, productTitle = '', cityName = ''): Promise<string | null> {
  const gen = await getGeneratedPrimarySlug(productId, locationId, productTitle, cityName);
  if (gen) return gen;
  const { data: maps } = await supabase
    .from('service_location_products')
    .select('services!fk_service(slug, title, display_order, status, is_tech_service)')
    .eq('product_id', productId)
    .eq('location_id', locationId)
    .eq('is_enabled', true);
  const cands = ((maps as any[]) || []).map((r) => r.services).filter(ok);
  return choosePrimary(cands, productTitle, cityName)?.slug ?? null;
}
