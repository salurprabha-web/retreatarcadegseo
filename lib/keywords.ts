/**
 * The keyword owner list (server only).
 * Rule: one search phrase has ONE owner page. Page generators and the blog writer check here first,
 * so two pages never fight for the same search.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CITIES } from '@/lib/cities';
import { choosePrimary } from '@/lib/primary-pick';
import { dataForSeoConfigured, fetchSearchVolumes } from '@/lib/dataforseo';

export const keyOf = (k: string) => String(k || '').toLowerCase().replace(/\s+/g, ' ').trim();

export type Owner = { type: 'product_city' | 'service_city' | 'city' | 'blog'; ref: string; url: string };

/** Who owns this phrase right now? null = nobody (free to use). Works even if the table does not exist yet. */
export async function getKeywordOwner(db: SupabaseClient, keyword: string) {
  const { data, error } = await db.from('seo_keywords').select('keyword, owner_type, owner_ref, owner_url').eq('keyword_key', keyOf(keyword)).maybeSingle();
  if (error || !data) return null;
  return (data as any).owner_type && (data as any).owner_type !== 'none' ? (data as any) : null;
}

/** Records that a page/post now owns a phrase. Returns false when someone else owns it. */
export async function claimKeyword(db: SupabaseClient, k: { keyword: string; citySlug?: string | null; intent?: string; owner: Owner }) {
  const key = keyOf(k.keyword);
  const { data: ex, error } = await db.from('seo_keywords').select('id, owner_type, owner_ref').eq('keyword_key', key).maybeSingle();
  if (error) return { ok: true, tracked: false }; // table not created yet: nothing to enforce
  if (ex && (ex as any).owner_type !== 'none' && (ex as any).owner_ref !== k.owner.ref) return { ok: false, tracked: true };
  const row = { keyword: k.keyword.trim(), city_slug: k.citySlug || null, intent: k.intent || null, owner_type: k.owner.type, owner_ref: k.owner.ref, owner_url: k.owner.url, status: 'active', updated_at: new Date().toISOString() };
  if (ex) await db.from('seo_keywords').update(row).eq('id', (ex as any).id);
  else await db.from('seo_keywords').insert({ ...row, source: 'auto' });
  return { ok: true, tracked: true };
}

/* ------------------------------------------------------------- candidates */

const BUY = [
  'photo booth rental', '360 photo booth rental', 'magic mirror photo booth', 'ai photo booth rental', 'event games rental',
  'interactive games rental', 'vr simulator rental', 'arcade games on rent', 'team building activities',
  'corporate event entertainment', 'brand activation activities', 'college fest games', 'wedding entertainment',
];
const INFO = [
  'photo booth rental cost', 'photo booth price', 'corporate event ideas', 'team building activity ideas',
  'sangeet entertainment ideas', 'college fest ideas', 'how to plan a corporate event', 'birthday party entertainment ideas',
  'wedding reception entertainment ideas', 'vr rental price',
];

export function candidatePhrases(cities: { slug: string; city: string; alias?: string | null }[], productTitles: string[]) {
  const out: { keyword: string; city_slug: string; intent: string }[] = [];
  for (const c of cities) {
    const names = [c.city.toLowerCase(), ...(c.alias ? [String(c.alias).toLowerCase()] : [])];
    BUY.forEach((t, i) => names.slice(0, i < 6 ? 2 : 1).forEach((n) => out.push({ keyword: `${t} ${n}`, city_slug: c.slug, intent: 'buy' })));
    INFO.forEach((t) => out.push({ keyword: `${t} in ${names[names.length - 1]}`, city_slug: c.slug, intent: 'info' }));
    for (const p of productTitles) {
      const base = p.split(/\s[–—|-]\s/)[0].replace(/\s+/g, ' ').trim().toLowerCase();
      if (base.length > 4) out.push({ keyword: `${base} ${names[names.length - 1]}`, city_slug: c.slug, intent: 'buy' });
    }
  }
  return out;
}

/* -------------------------------------------------------------- sync owners */

type Want = { keyword: string; city_slug: string | null; owner_type: string; owner_ref: string; owner_url: string };

/** Reads every published page and registers its main keyword. Never overwrites another page's claim. */
export async function syncOwners(db: SupabaseClient) {
  const wants: Want[] = [];

  const [{ data: plp }, { data: slSeo }, { data: locs }, { data: posts }] = await Promise.all([
    db.from('product_location_pages').select('*, services(slug, title, display_order, status), events(slug, title, category), locations(slug, city)').eq('status', 'published').limit(10000),
    db.from('service_location_seo').select('*, services(slug, title, status), locations(slug)').eq('status', 'published').not('generated_by', 'is', null).limit(5000),
    db.from('locations').select('id, slug, city, alias, page_status, page_content'),
    db.from('blog_posts').select('id, slug, focus_keyword, city_slug, status').eq('status', 'published').limit(2000),
  ]);

  // product pages: only each product's primary page owns the phrase
  const groups = new Map<string, any[]>();
  for (const r of (plp as any[]) || []) {
    if (!r.focus_keyword || !r.services || r.services.status !== 'published' || !r.events || !r.locations) continue;
    const k = `${r.location_id}|${r.product_id}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  groups.forEach((rows) => {
    const pick = choosePrimary(rows.map((r) => ({ ...r, slug: r.services.slug, title: r.services.title, display_order: r.services.display_order })), `${rows[0].events.title} ${rows[0].events.category || ''}`, rows[0].locations.city);
    if (pick) wants.push({ keyword: pick.focus_keyword, city_slug: pick.locations.slug, owner_type: 'product_city', owner_ref: pick.id, owner_url: `/services/${pick.services.slug}/${pick.locations.slug}/${pick.events.slug}` });
  });

  for (const r of (slSeo as any[]) || []) {
    if (!r.focus_keyword || !r.services || !r.locations) continue;
    wants.push({ keyword: r.focus_keyword, city_slug: r.locations.slug, owner_type: 'service_city', owner_ref: r.id, owner_url: `/services/${r.services.slug}/${r.locations.slug}` });
  }

  for (const l of (locs as any[]) || []) {
    const c = l.page_content || {};
    if (l.page_status === 'published' && c.focus_keyword) wants.push({ keyword: c.focus_keyword, city_slug: l.slug, owner_type: 'city', owner_ref: l.id, owner_url: `/locations/${l.slug}` });
  }
  // the hand-written Hyderabad and Visakhapatnam pages
  for (const c of CITIES) c.keywords.slice(0, 3).forEach((k) => wants.push({ keyword: k, city_slug: c.slug, owner_type: 'city', owner_ref: `city:${c.slug}`, owner_url: `/locations/${c.slug}` }));

  for (const p of (posts as any[]) || []) {
    if (p.focus_keyword) wants.push({ keyword: p.focus_keyword, city_slug: p.city_slug || null, owner_type: 'blog', owner_ref: p.id, owner_url: `/blog/${p.slug}` });
  }

  const probe = await db.from('seo_keywords').select('id').limit(1);
  if (probe.error) throw new Error('Run AUTO_PAGES_STEP5.sql in Supabase first (it creates the keyword list).');

  const existing = new Map<string, any>();
  for (let from = 0; from < 50000; from += 1000) {
    const { data } = await db.from('seo_keywords').select('id, keyword_key, owner_type, owner_ref, owner_url').range(from, from + 999);
    (data || []).forEach((r: any) => existing.set(r.keyword_key, r));
    if (!data || data.length < 1000) break;
  }

  let added = 0, claimed = 0, updated = 0;
  const conflicts: { keyword: string; owner: string; wanted: string }[] = [];
  const now = new Date().toISOString();
  const seen = new Set<string>();
  for (const w of wants) {
    const key = keyOf(w.keyword);
    if (!key || seen.has(key)) {
      if (key && seen.has(key)) conflicts.push({ keyword: w.keyword, owner: '(another page in this run)', wanted: w.owner_url });
      continue;
    }
    seen.add(key);
    const ex = existing.get(key);
    const base = { owner_type: w.owner_type, owner_ref: w.owner_ref, owner_url: w.owner_url, city_slug: w.city_slug, status: 'active', updated_at: now };
    if (!ex) {
      const { error } = await db.from('seo_keywords').insert({ keyword: w.keyword.trim(), ...base, source: 'auto' });
      if (!error) added++;
    } else if (ex.owner_type === 'none') {
      await db.from('seo_keywords').update(base).eq('id', ex.id);
      claimed++;
    } else if (ex.owner_ref === w.owner_ref) {
      if (ex.owner_url !== w.owner_url) { await db.from('seo_keywords').update({ owner_url: w.owner_url, updated_at: now }).eq('id', ex.id); updated++; }
    } else {
      conflicts.push({ keyword: w.keyword, owner: ex.owner_url || ex.owner_type, wanted: w.owner_url });
    }
  }
  return { added, claimed, updated, conflicts };
}

/* ------------------------------------------------- shared by the screen and the weekly run */

/** Adds phrase ideas for every live city (skips phrases that already exist). Returns how many were added. */
export async function addCandidateIdeas(db: SupabaseClient) {
  const [{ data: locs }, { data: prods }] = await Promise.all([
    db.from('locations').select('slug, city, alias, is_active'),
    db.from('events').select('title').eq('status', 'published'),
  ]);
  const cities = ((locs as any[]) || []).filter((l) => l.is_active || ['hyderabad', 'visakhapatnam'].includes(l.slug));
  const cands = candidatePhrases(cities, ((prods as any[]) || []).map((p) => p.title));
  const existing = new Set<string>();
  for (let from = 0; from < 50000; from += 1000) {
    const { data } = await db.from('seo_keywords').select('keyword_key').range(from, from + 999);
    (data || []).forEach((r: any) => existing.add(r.keyword_key));
    if (!data || data.length < 1000) break;
  }
  const seen = new Set<string>();
  const fresh = cands.filter((c) => {
    const k = keyOf(c.keyword);
    if (existing.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  for (let i = 0; i < fresh.length; i += 200) {
    await db.from('seo_keywords').insert(fresh.slice(i, i + 200).map((c) => ({ ...c, source: 'auto', status: 'idea', owner_type: 'none' })));
  }
  return fresh.length;
}

/** Looks up search volumes for phrases that have none. Needs DataForSEO. */
export async function fillVolumes(db: SupabaseClient, limit = 300) {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const { data } = await db.from('seo_keywords').select('id, keyword').is('volume', null).order('created_at').limit(Math.min(limit, 700));
  const rows = (data as any[]) || [];
  if (!rows.length) return { updated: 0, asked: 0 };
  const vols = await fetchSearchVolumes(rows.map((r) => r.keyword));
  const byKey = new Map(vols.map((v) => [keyOf(v.keyword), v]));
  const now = new Date().toISOString();
  let updated = 0;
  for (const r of rows) {
    const v = byKey.get(keyOf(r.keyword));
    const { error } = await db.from('seo_keywords').update({ volume: v?.volume ?? 0, competition: v?.competition ?? null, cpc: v?.cpc ?? null, source: 'dataforseo', fetched_at: now, updated_at: now }).eq('id', r.id);
    if (!error) updated++;
  }
  return { updated, asked: rows.length };
}

/** Remembers the last automatic run so the Keywords screen can show it. */
export async function saveRunLog(db: SupabaseClient, summary: Record<string, any>) {
  const value = { at: new Date().toISOString(), ...summary };
  const { data: ex } = await db.from('site_settings').select('id').eq('key', 'seo_last_run').maybeSingle();
  if (ex) await db.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', (ex as any).id);
  else await db.from('site_settings').insert({ key: 'seo_last_run', value, description: 'Last automatic SEO run' });
}
export async function readRunLog(db: SupabaseClient) {
  const { data } = await db.from('site_settings').select('value').eq('key', 'seo_last_run').maybeSingle();
  return (data as any)?.value || null;
}
