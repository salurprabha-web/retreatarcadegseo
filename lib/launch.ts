/**
 * The product launch chain (server only).
 *   draft  -> AI wrote the product page (see lib/product-writer.ts)
 *   published -> you approved it; it is live and attached to the services you ticked
 *   cities -> a page for every live city is being written as DRAFTS, built around each city's best phrase
 *   done   -> all city drafts exist; you approve them in one click
 * Each request does a slice of work inside the time the server allows; the screen (or the daily job) keeps calling it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPlan, generateItem, loadCorpus } from '@/lib/page-generator';
import { leadPhrasesFor } from '@/lib/lead-phrase';
import { keyOf } from '@/lib/keywords';

export async function publishLaunch(db: SupabaseClient, launchId: string, opts: { serviceIds: string[]; priceOnRequest: boolean }) {
  const { data: launch } = await db.from('product_launches').select('*').eq('id', launchId).single();
  if (!launch) throw new Error('Launch not found');
  if ((launch as any).stage !== 'draft') throw new Error('This product is already published.');
  const productId = (launch as any).product_id;
  const { data: product } = await db.from('events').select('id, slug, title, price, image_url').eq('id', productId).single();
  if (!product) throw new Error('Product not found');
  if ((product as any).price == null && !opts.priceOnRequest) throw new Error('Enter a price, or tick "Price on request".');
  if (!(product as any).image_url) throw new Error('The product needs a main picture.');
  const ids = Array.from(new Set(opts.serviceIds || []));
  if (!ids.length) throw new Error('Tick at least one service for this product.');
  const { data: services } = await db.from('services').select('id, related_event_ids').in('id', ids).eq('status', 'published');
  if (!services || services.length !== ids.length) throw new Error('One of the ticked services is not published.');

  const now = new Date().toISOString();
  const up = await db.from('events').update({ status: 'published', published_at: now, updated_at: now }).eq('id', productId);
  if (up.error) throw up.error;
  for (const s of services as any[]) {
    const cur: string[] = Array.isArray(s.related_event_ids) ? s.related_event_ids : [];
    if (!cur.includes(productId)) await db.from('services').update({ related_event_ids: [...cur, productId], updated_at: now }).eq('id', s.id);
  }
  await db.from('product_launches').update({ stage: 'published', service_ids: ids, updated_at: now, log: [...(((launch as any).log as any[]) || []), { at: now, step: 'published', services: ids.length }] }).eq('id', launchId);
  return { slug: (product as any).slug, title: (product as any).title };
}

const infoPhrases = (name: string, city: string) => {
  const core = name.toLowerCase().split(/\s[–—|-]\s/)[0].replace(/\b(rental|rentals|rent|hire)\b/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return [`${core} rental cost in ${city}`, `${core} price in ${city}`, `how much does ${core} rental cost in ${city}`];
};

async function addBlogIdeas(db: SupabaseClient, productName: string, cities: { slug: string; city: string; alias?: string | null }[]) {
  const phrases: { keyword: string; city_slug: string }[] = [];
  for (const c of cities.slice(0, 6)) {
    const nm = String(c.alias || c.city).toLowerCase();
    infoPhrases(productName, nm).forEach((p) => phrases.push({ keyword: p, city_slug: c.slug }));
  }
  if (!phrases.length) return 0;
  const probe = await db.from('seo_keywords').select('id').limit(1);
  if (probe.error) return 0;
  const { data } = await db.from('seo_keywords').select('keyword_key').in('keyword_key', phrases.map((p) => keyOf(p.keyword)));
  const have = new Set((data || []).map((r: any) => r.keyword_key));
  const fresh = phrases.filter((p) => !have.has(keyOf(p.keyword)));
  if (fresh.length) await db.from('seo_keywords').insert(fresh.map((p) => ({ ...p, source: 'auto', status: 'idea', owner_type: 'none', intent: 'info' })));
  return fresh.length;
}

/** One slice of the city-page work. Safe to call again and again: it only creates what is still missing. */
export async function runCitiesChunk(db: SupabaseClient, launchId: string, budgetMs = 40000) {
  const started = Date.now();
  const { data: launch } = await db.from('product_launches').select('*').eq('id', launchId).single();
  if (!launch) throw new Error('Launch not found');
  const L: any = launch;
  if (L.stage === 'draft') throw new Error('Publish the product first.');
  const productId = L.product_id;

  const plan = await buildPlan(db, { productId });
  const cityById = new Map<string, any>(((plan.cities as any[]) || []).map((c) => [c.id, c]));
  const { data: product } = await db.from('events').select('title').eq('id', productId).single();
  const name = String((product as any)?.title || '');
  const { count: existing } = await db.from('product_location_pages').select('id', { count: 'exact', head: true }).eq('product_id', productId);

  let queue = plan.items.slice();
  const total = (existing || 0) + queue.length;
  if (L.stage === 'published') await db.from('product_launches').update({ stage: 'cities', cities_total: total, updated_at: new Date().toISOString() }).eq('id', launchId);

  const corpus = await loadCorpus(db);
  const failed: { label: string; error?: string }[] = [];
  let made = 0;
  while (queue.length && Date.now() - started < budgetMs) {
    const batch = queue.splice(0, 3);
    const leads = await leadPhrasesFor(db, batch.map((it) => { const c = cityById.get(it.location_id); return { id: it.location_id, name, cityNames: [...(c?.alias ? [String(c.alias).toLowerCase()] : []), String(c?.city || '').toLowerCase()] }; }));
    batch.forEach((it) => { it.leadPhrase = leads.get(it.location_id)?.phrase; });
    const res = await Promise.all(batch.map((it) => generateItem(db, it, corpus)));
    res.forEach((r) => (r.ok ? made++ : failed.push({ label: r.label, error: r.error })));
  }

  const remaining = queue.length;
  const now = new Date().toISOString();
  const doneNow = (existing || 0) + made;
  if (!remaining && !failed.length) {
    const ideas = await addBlogIdeas(db, name, ((plan.cities as any[]) || []).map((c) => ({ slug: c.slug, city: c.city, alias: c.alias })));
    await db.from('product_launches').update({ stage: 'done', cities_total: Math.max(total, doneNow), cities_done: doneNow, updated_at: now, log: [...((L.log as any[]) || []), { at: now, step: 'cities done', pages: doneNow, blogIdeas: ideas }] }).eq('id', launchId);
  } else {
    await db.from('product_launches').update({ cities_done: doneNow, updated_at: now }).eq('id', launchId);
  }
  return { made, remaining, failed, done: !remaining && !failed.length, total, doneCount: doneNow };
}

/** Launches the daily job should keep going with. */
export async function openLaunches(db: SupabaseClient) {
  const { data } = await db.from('product_launches').select('id').eq('stage', 'cities').limit(10);
  return ((data as any[]) || []).map((r) => r.id as string);
}
