/**
 * All cities that have a public landing page.
 *  - Hand-written entries in lib/cities.ts (Hyderabad, Visakhapatnam) always win.
 *  - Every other city comes from the `locations` table, once its generated page has been published
 *    in /admin/auto-pages and the city is marked live.
 */
import { supabase } from '@/lib/supabase';
import { CITIES, type City } from '@/lib/cities';

type Row = Record<string, any>;

function fromRow(r: Row): City | null {
  const c = r.page_content || {};
  if (r.page_status !== 'published' || !r.is_active || !c.meta_title || !Array.isArray(c.intro)) return null;
  const name: string = r.city;
  return {
    slug: r.slug,
    name,
    alias: r.alias || undefined,
    state: r.state || '',
    home: !!r.is_home,
    geo: { lat: Number(r.geo_lat) || 20.5937, lng: Number(r.geo_lng) || 78.9629 },
    metaTitle: c.meta_title,
    metaDescription: c.meta_description || '',
    keywords: [`event rentals ${name}`, `photo booth rental ${name}`, `interactive games rental ${name}`, `360 photo booth ${name}`, `team building activities ${name}`],
    heroLine: c.hero_line || `Interactive games, photo booths and VR for events in ${name}.`,
    intro: c.intro,
    areas: Array.isArray(r.areas) ? r.areas : [],
    venues: Array.isArray(r.venues) ? r.venues : [],
    occasions: Array.isArray(c.occasions) ? c.occasions : [],
    faqs: Array.isArray(c.faqs) ? c.faqs : [],
    nearby: Array.isArray(r.nearby) ? r.nearby : [],
  };
}

export async function getAllCities(): Promise<City[]> {
  const handWritten = new Set(CITIES.map((c) => c.slug));
  const { data } = await supabase.from('locations').select('*').eq('page_status', 'published').eq('is_active', true);
  const extra = ((data as Row[]) || [])
    .filter((r) => !handWritten.has(r.slug))
    .map(fromRow)
    .filter((c): c is City => !!c)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...CITIES, ...extra];
}

export async function findCity(slug: string): Promise<City | undefined> {
  const hand = CITIES.find((c) => c.slug === slug);
  if (hand) return hand;
  const { data } = await supabase.from('locations').select('*').eq('slug', slug).maybeSingle();
  return data ? fromRow(data as Row) || undefined : undefined;
}
