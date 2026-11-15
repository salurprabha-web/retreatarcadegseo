/**
 * Internal link graph (reads the public site data).
 * Used to (1) give the blog writer real pages it may link to, and (2) draw "related" blocks at page
 * render time, so links are always current and always point at each product's ONE primary address.
 */
import { supabase } from '@/lib/supabase';
import { findCity } from '@/lib/city-data';
import { choosePrimary } from '@/lib/primary-pick';

export type LinkTarget = { id: string; kind: 'city' | 'service' | 'product' | 'blog' | 'tool'; label: string; url: string };

/** Every product that has its own approved page in the city, linked to its primary address. */
export async function getCityProductLinks(citySlug: string, cityName: string): Promise<{ name: string; url: string; price: number | null }[]> {
  const { data } = await supabase
    .from('product_location_pages')
    .select('services(slug, title, display_order, status), events(title, slug, price, category), locations!inner(slug)')
    .eq('status', 'published')
    .eq('locations.slug', citySlug)
    .limit(3000);
  const by = new Map<string, any[]>();
  ((data as any[]) || []).forEach((r) => {
    if (!r.events?.slug || r.services?.status !== 'published') return;
    if (!by.has(r.events.slug)) by.set(r.events.slug, []);
    by.get(r.events.slug)!.push(r);
  });
  const out: { name: string; url: string; price: number | null }[] = [];
  by.forEach((rows, pslug) => {
    const pick = choosePrimary(rows.map((r) => ({ ...r, slug: r.services.slug, title: r.services.title, display_order: r.services.display_order })), `${rows[0].events.title} ${rows[0].events.category || ''}`, cityName);
    if (pick) out.push({ name: String(rows[0].events.title).trim(), url: `/services/${pick.slug}/${citySlug}/${pslug}`, price: rows[0].events.price ?? null });
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Published blog posts about a city (for "guides" blocks on city and product pages). */
export async function getCityGuides(citySlug: string, limit = 4) {
  const { data } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, featured_image_url, published_at')
    .eq('status', 'published')
    .eq('city_slug', citySlug)
    .or('published_at.is.null,published_at.lte.' + new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data as any[]) || [];
}

/** Pages a blog post may link to. The blog writer picks from this list; nothing else is allowed as a link. */
export async function getLinkCandidates(opts: { citySlug?: string | null; excludeSlug?: string }): Promise<LinkTarget[]> {
  const out: Omit<LinkTarget, 'id'>[] = [];
  const city = opts.citySlug ? await findCity(opts.citySlug) : undefined;

  if (opts.citySlug && city) {
    out.push({ kind: 'city', label: `Event entertainment in ${city.name}`, url: `/locations/${city.slug}` });
    const { data: svc } = await supabase
      .from('service_location_seo')
      .select('status, services!inner(slug, title, status, is_tech_service), locations!inner(slug)')
      .eq('locations.slug', city.slug)
      .eq('status', 'published')
      .limit(60);
    ((svc as any[]) || []).forEach((r) => {
      if (r.services?.status === 'published' && !r.services?.is_tech_service) out.push({ kind: 'service', label: `${r.services.title} in ${city.name}`.replace(/\s+/g, ' ').trim(), url: `/services/${r.services.slug}/${city.slug}` });
    });
    (await getCityProductLinks(city.slug, city.name)).slice(0, 40).forEach((p) => out.push({ kind: 'product', label: `${p.name} in ${city.name}`, url: p.url }));
  } else {
    const { data: svc } = await supabase.from('services').select('slug, title, is_tech_service').eq('status', 'published').limit(30);
    ((svc as any[]) || []).filter((s) => !s.is_tech_service).forEach((s) => out.push({ kind: 'service', label: String(s.title).trim(), url: `/services/${s.slug}` }));
    const { data: ev } = await supabase.from('events').select('slug, title').eq('status', 'published').eq('is_featured', true).limit(12);
    ((ev as any[]) || []).forEach((e) => out.push({ kind: 'product', label: String(e.title).trim(), url: `/events/${e.slug}` }));
  }

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .eq('status', 'published')
    .or('published_at.is.null,published_at.lte.' + new Date().toISOString())
    .limit(40);
  ((posts as any[]) || []).filter((p) => p.slug !== opts.excludeSlug).slice(0, 8).forEach((p) => out.push({ kind: 'blog', label: p.title, url: `/blog/${p.slug}` }));

  out.push({ kind: 'tool', label: '3D event planner', url: `/plan-your-event${city ? `?city=${city.slug}` : ''}` });
  out.push({ kind: 'tool', label: 'Contact us for a quote', url: '/contact' });

  return out.slice(0, 60).map((t, i) => ({ id: `L${i + 1}`, ...t }));
}
