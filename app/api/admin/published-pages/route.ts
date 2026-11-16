import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { CITIES } from '@/lib/cities';
import { choosePrimary } from '@/lib/primary-pick';

export const runtime = 'nodejs';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

/** GET -> every page created by Auto Pages that is published, with its public address */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const db = adminDb();
  const [svc, prod, cityRes] = await Promise.all([
    db.from('service_location_seo').select('*, services(title, slug), locations(city, slug)').eq('status', 'published').not('generated_by', 'is', null).limit(5000),
    db.from('product_location_pages').select('*, services(title, slug, display_order), locations(city, slug), events(title, slug, category)').eq('status', 'published').limit(5000),
    db.from('locations').select('id, city, slug, is_active, page_content').eq('page_status', 'published'),
  ]);
  if (svc.error || prod.error) return NextResponse.json({ error: (svc.error || prod.error)!.message }, { status: 500 });

  const hand = new Set(CITIES.map((c) => c.slug));
  const pages = [
    ...(cityRes.data || []).filter((c: any) => !hand.has(c.slug)).map((c: any) => ({
      kind: 'city_page', id: c.id, city: c.city, meta_title: c.page_content?.meta_title || '', meta_description: c.page_content?.meta_description || '', focus_keyword: c.page_content?.focus_keyword || '', intro: Array.isArray(c.page_content?.intro) ? c.page_content.intro.join('\n\n') : '', faqs: c.page_content?.faqs || [], name: `${c.city} city page`, title: c.page_content?.meta_title || '', url: `${SITE}/locations/${c.slug}`, note: c.is_active ? '' : 'City is not marked live, so this page is not shown',
    })),
    ...(svc.data || []).filter((r: any) => r.services?.slug && r.locations?.slug).map((r: any) => ({
      kind: 'service_city', id: r.id, city: r.locations.city, meta_title: r.meta_title || '', meta_description: r.meta_description || '', focus_keyword: r.focus_keyword || '', intro: r.intro || '', faqs: r.faqs || [], name: `${r.services.title} in ${r.locations.city}`, title: r.meta_title || '', url: `${SITE}/services/${r.services.slug}/${r.locations.slug}`, note: '',
    })),
    ...(prod.data || []).filter((r: any) => r.services?.slug && r.locations?.slug && r.events?.slug).map((r: any) => ({
      kind: 'product_city', id: r.id, city: r.locations.city, meta_title: r.meta_title || '', meta_description: r.meta_description || '', focus_keyword: r.focus_keyword || '', intro: r.intro || '', faqs: r.faqs || [], name: `${r.events.title} in ${r.locations.city}`, title: r.meta_title || '', url: `${SITE}/services/${r.services.slug}/${r.locations.slug}/${r.events.slug}`, note: '',
    })),
  ];

  // only the main page of a product in a city carries the keyword; the other versions point to it
  const groups = new Map<string, any[]>();
  (prod.data || []).forEach((r: any) => {
    if (!r.services?.slug || !r.events?.slug) return;
    const k = `${r.location_id}|${r.product_id}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  });
  const mainIds = new Set<string>();
  groups.forEach((rows) => {
    const pick = choosePrimary(rows.map((r: any) => ({ ...r, slug: r.services.slug, title: r.services.title, display_order: r.services.display_order })), `${rows[0].events.title} ${rows[0].events.category || ''}`, rows[0].locations?.city);
    if (pick) mainIds.add(pick.id);
  });
  pages.forEach((p: any) => { p.isMain = p.kind !== 'product_city' || mainIds.has(p.id); });

  // page views (needs AUTO_PAGES_STEP3.sql); without it the list still works, just without counts
  const views = new Map<string, { total: number; today: number }>();
  let viewsReady = true;
  for (let from = 0; from < 50000; from += 1000) {
    const { data, error } = await db.from('page_view_totals').select('path, total, today').range(from, from + 999);
    if (error) { viewsReady = false; break; }
    (data || []).forEach((r: any) => views.set(r.path, { total: r.total, today: r.today }));
    if (!data || data.length < 1000) break;
  }
  const withViews = pages.map((p: any) => {
    const path = new URL(p.url).pathname.toLowerCase().replace(/\/+$/, '');
    const v = views.get(path);
    return { ...p, total: v?.total || 0, today: v?.today || 0 };
  });
  return NextResponse.json({ pages: withViews, viewsReady });
}
