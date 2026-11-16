/**
 * "Our work": real events with photos, a short story and (with permission) a client quote.
 * Public readers use the anon client and only ever see published rows (database rule).
 * Everything here returns empty lists when the table does not exist yet, so the site never breaks.
 */
import { supabase } from '@/lib/supabase';

export type CasePhoto = { url: string; alt: string; caption?: string };
export type CaseStudy = {
  id: string; slug: string; title: string; city_slug: string | null; area: string | null; event_type: string | null;
  event_date: string | null; guests: string | null; product_slugs: string[]; story: string | null; photos: CasePhoto[];
  quote_text: string | null; quote_name: string | null; quote_role: string | null; quote_approved: boolean; client_name: string | null;
  meta_title: string | null; meta_description: string | null; focus_keyword: string | null; published_at: string | null; updated_at: string | null;
};

const COLS = 'id, slug, title, city_slug, area, event_type, event_date, guests, product_slugs, story, photos, quote_text, quote_name, quote_role, quote_approved, client_name, meta_title, meta_description, focus_keyword, published_at, updated_at';

export async function getPublishedCaseStudies(opts: { citySlug?: string; productSlug?: string; limit?: number; excludeSlug?: string } = {}): Promise<CaseStudy[]> {
  let q = supabase.from('case_studies').select(COLS).eq('status', 'published').order('event_date', { ascending: false, nullsFirst: false }).limit(opts.limit || 60);
  if (opts.citySlug) q = q.eq('city_slug', opts.citySlug);
  if (opts.productSlug) q = q.contains('product_slugs', [opts.productSlug]);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as any[]).filter((r) => r.slug !== opts.excludeSlug).map(clean);
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const { data, error } = await supabase.from('case_studies').select(COLS).eq('slug', slug).eq('status', 'published').maybeSingle();
  return error || !data ? null : clean(data);
}

export async function hasCaseStudies() {
  const { count, error } = await supabase.from('case_studies').select('id', { count: 'exact', head: true }).eq('status', 'published');
  return !error && (count || 0) > 0;
}

function clean(r: any): CaseStudy {
  const approved = !!r.quote_approved;
  return {
    ...r,
    product_slugs: Array.isArray(r.product_slugs) ? r.product_slugs : [],
    photos: (Array.isArray(r.photos) ? r.photos : []).filter((p: any) => p?.url),
    // a quote or a client name is only ever shown when the owner ticked "approved"
    quote_approved: approved,
    quote_text: approved ? r.quote_text : null,
    quote_name: approved ? r.quote_name : null,
    quote_role: approved ? r.quote_role : null,
    client_name: approved ? r.client_name : null,
  };
}

export const EVENT_TYPES = ['Corporate event', 'Annual day', 'Wedding', 'Sangeet', 'Reception', 'College fest', 'Birthday', 'Brand activation', 'Exhibition', 'Product launch', 'Other'];
