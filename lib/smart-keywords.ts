/**
 * Smart keyword picker (server only).
 *
 * For each AI-written page it:
 *  1. builds the phrases people really type (product name + "rental"/"hire"/"on rent" + the city and its nickname)
 *  2. looks up real monthly searches with DataForSEO (when connected)
 *  3. picks the most-searched phrase that no other page owns
 *  4. when there is no search data, asks Claude which phrase people in that city most likely type
 *  5. saves it on the page and records ownership in the keyword list
 *
 * It only changes the page's "main keyword" and the keyword list. It never rewrites titles or text.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { choosePrimary } from '@/lib/primary-pick';
import { keyOf } from '@/lib/keywords';
import { dataForSeoConfigured, fetchSearchVolumes } from '@/lib/dataforseo';

const MODEL = 'claude-sonnet-5-5';
const CITY_WORDS = ['hyderabad', 'visakhapatnam', 'vizag', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'pune', 'delhi', 'kolkata', 'secunderabad', 'vijayawada'];

type Target = {
  table: 'product_location_pages' | 'service_location_seo';
  id: string;
  name: string; // product or service title
  citySlug: string;
  cityNames: string[]; // nickname first when there is one: ['vizag', 'visakhapatnam']
  current: string | null;
  candidates: string[];
};

const core = (title: string) => {
  let s = String(title || '').split(/\s[–—|-]\s/)[0].toLowerCase();
  for (const c of CITY_WORDS) s = s.replace(new RegExp(`\\s*\\b(?:in|for|at)?\\s*${c}\\b`, 'gi'), ' ');
  return s.replace(/\b(rental|rentals|rent|hire|services?)\b/g, ' ').replace(/[^a-z0-9°&\s]/g, ' ').replace(/\s{2,}/g, ' ').trim();
};

export function makeCandidates(name: string, cityNames: string[]) {
  const base = core(name);
  if (base.length < 3) return [];
  const short = base.replace(/\b360 degree\b/g, '360');
  const forms = Array.from(new Set([base, short, base.replace(/\bphotobooth\b/g, 'photo booth'), short.replace(/\bphotobooth\b/g, 'photo booth'), base.replace(/\bphoto booth\b/g, 'photobooth')]));
  const out: string[] = [];
  for (const city of cityNames) for (const f of forms) for (const tail of ['rental', 'hire', 'on rent', '']) out.push(`${f} ${tail} ${city}`.replace(/\s{2,}/g, ' ').trim());
  return Array.from(new Set(out)).slice(0, 24);
}

async function loadTargets(db: SupabaseClient, mode: 'missing' | 'weak'): Promise<Target[]> {
  const [{ data: plp }, { data: slSeo }] = await Promise.all([
    db.from('product_location_pages').select('*, services(slug, title, display_order, status), events(title, category), locations(slug, city, alias)').eq('status', 'published').limit(10000),
    db.from('service_location_seo').select('*, services(title, status), locations(slug, city, alias)').eq('status', 'published').not('generated_by', 'is', null).limit(5000),
  ]);
  const names = (l: any) => [...(l.alias ? [String(l.alias).toLowerCase()] : []), String(l.city).toLowerCase()];
  const out: Target[] = [];

  // product pages: only each product's primary page carries the keyword
  const groups = new Map<string, any[]>();
  for (const r of (plp as any[]) || []) {
    if (!r.services || r.services.status !== 'published' || !r.events || !r.locations) continue;
    const k = `${r.location_id}|${r.product_id}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  groups.forEach((rows) => {
    const pick = choosePrimary(rows.map((r) => ({ ...r, slug: r.services.slug, title: r.services.title, display_order: r.services.display_order })), `${rows[0].events.title} ${rows[0].events.category || ''}`, rows[0].locations.city);
    if (!pick) return;
    out.push({ table: 'product_location_pages', id: pick.id, name: pick.events.title, citySlug: pick.locations.slug, cityNames: names(pick.locations), current: pick.focus_keyword || null, candidates: makeCandidates(pick.events.title, names(pick.locations)) });
  });
  for (const r of (slSeo as any[]) || []) {
    if (!r.services || !r.locations) continue;
    out.push({ table: 'service_location_seo', id: r.id, name: r.services.title, citySlug: r.locations.slug, cityNames: names(r.locations), current: r.focus_keyword || null, candidates: makeCandidates(r.services.title, names(r.locations)) });
  }
  const t = out.filter((x) => x.candidates.length);
  return mode === 'missing' ? t.filter((x) => !x.current) : t;
}

async function volumesFor(db: SupabaseClient, phrases: string[]) {
  const map = new Map<string, number | null>();
  for (let i = 0; i < phrases.length; i += 150) {
    const keys = phrases.slice(i, i + 150).map(keyOf);
    const { data } = await db.from('seo_keywords').select('keyword_key, volume, owner_type, owner_ref').in('keyword_key', keys);
    (data || []).forEach((r: any) => map.set(r.keyword_key, r));
  }
  return map as Map<string, any>;
}

export type SmartResult = { processed: number; changed: number; remaining: number; usedVolumes: boolean; usedAi: boolean; fetchedVolumes: number; notes: string[] };

/**
 * mode 'missing': pages with no keyword yet. mode 'weak': also re-checks pages whose keyword has no search data
 * or is beaten by a clearly better phrase. `limit` keeps one run inside the time the server allows.
 */
export async function runSmartKeywords(db: SupabaseClient, opts: { mode?: 'missing' | 'weak'; limit?: number; useAi?: boolean }): Promise<SmartResult> {
  const mode = opts.mode || 'missing';
  const limit = Math.min(Math.max(opts.limit || 30, 1), 60);
  const notes: string[] = [];
  const probe = await db.from('seo_keywords').select('id').limit(1);
  const tableReady = !probe.error;
  if (!tableReady) notes.push('Run AUTO_PAGES_STEP5.sql so keywords can be tracked; picking from names only.');

  let all = await loadTargets(db, mode);
  // 'weak' re-checks pages that already have a keyword: those whose keyword has no volume yet come first
  if (mode === 'weak' && tableReady) {
    const cur = await volumesFor(db, all.map((t) => t.current || '').filter(Boolean));
    all = all.sort((a, b) => Number(!!cur.get(keyOf(a.current || ''))?.volume) - Number(!!cur.get(keyOf(b.current || ''))?.volume));
  }
  const batch = all.slice(0, limit);
  const remainingAfter = Math.max(all.length - batch.length, 0);
  if (!batch.length) return { processed: 0, changed: 0, remaining: 0, usedVolumes: false, usedAi: false, fetchedVolumes: 0, notes };

  // 1. make sure every candidate exists in the keyword list
  const allPhrases = Array.from(new Set(batch.flatMap((t) => t.candidates)));
  let fetched = 0;
  let usedVolumes = false;
  if (tableReady) {
    const have = await volumesFor(db, allPhrases);
    const fresh = allPhrases.filter((p) => !have.has(keyOf(p)));
    for (let i = 0; i < fresh.length; i += 200) {
      await db.from('seo_keywords').insert(fresh.slice(i, i + 200).map((p) => ({ keyword: p, source: 'auto', status: 'idea', owner_type: 'none', intent: 'buy', city_slug: batch.find((t) => t.candidates.includes(p))?.citySlug || null })));
    }
    // 2. real search volumes
    if (dataForSeoConfigured()) {
      const state = await volumesFor(db, allPhrases);
      const need = allPhrases.filter((p) => state.get(keyOf(p))?.volume == null).slice(0, 700);
      if (need.length) {
        try {
          const vols = await fetchSearchVolumes(need);
          const byKey = new Map(vols.map((v) => [keyOf(v.keyword), v]));
          const now = new Date().toISOString();
          for (const p of need) {
            const v = byKey.get(keyOf(p));
            await db.from('seo_keywords').update({ volume: v?.volume ?? 0, competition: v?.competition ?? null, cpc: v?.cpc ?? null, source: 'dataforseo', fetched_at: now, updated_at: now }).eq('keyword_key', keyOf(p));
            fetched++;
          }
          usedVolumes = true;
        } catch (e: any) { notes.push(`Search volumes not available: ${e.message}`); }
      } else usedVolumes = true;
    }
  }

  // 3. choose
  const state = tableReady ? await volumesFor(db, allPhrases) : new Map<string, any>();
  const chosen = new Map<string, string>();
  const needAi: Target[] = [];
  for (const t of batch) {
    const options = t.candidates.map((p) => ({ p, r: state.get(keyOf(p)) })).filter((o) => !o.r || !o.r.owner_ref || o.r.owner_ref === t.id || o.r.owner_type === 'none');
    const withVol = options.filter((o) => (o.r?.volume ?? 0) > 0).sort((a, b) => (b.r.volume - a.r.volume) || a.p.length - b.p.length);
    if (withVol.length) {
      const best = withVol[0];
      const curVol = t.current ? state.get(keyOf(t.current))?.volume ?? 0 : 0;
      // an existing keyword is only replaced by a clearly better one
      if (!t.current || best.r.volume > curVol * 1.3) chosen.set(t.id, best.p);
      else chosen.set(t.id, t.current);
    } else if (t.current) {
      chosen.set(t.id, t.current); // nothing better is known
    } else if (options.length) needAi.push(t);
  }

  // 4. no data: let Claude choose the phrase people most likely type
  let usedAi = false;
  if (needAi.length && opts.useAi !== false && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const payload = needAi.map((t) => ({ id: t.id, page: t.name, city: t.cityNames.join(' / '), options: t.candidates.filter((p) => { const r = state.get(keyOf(p)); return !r || !r.owner_ref || r.owner_ref === t.id; }) }));
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: 'You choose the main search phrase for web pages of an event entertainment rental company in India. For each page pick the ONE option that people in that city most likely type into Google when they want to hire this item. People often use the short city nickname (for example "vizag") and "rental" or "hire". Return exactly one of the given options for each id.',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, choice: { type: 'string' } }, required: ['id', 'choice'], additionalProperties: false } } }, required: ['items'], additionalProperties: false } } } as any,
        messages: [{ role: 'user', content: JSON.stringify(payload) }],
      } as any);
      const block: any = (res as any).content.find((b: any) => b.type === 'text');
      for (const it of JSON.parse(block.text).items as { id: string; choice: string }[]) {
        const t = needAi.find((x) => x.id === it.id);
        if (t && t.candidates.some((c) => keyOf(c) === keyOf(it.choice))) chosen.set(t.id, t.candidates.find((c) => keyOf(c) === keyOf(it.choice))!);
      }
      usedAi = true;
    } catch (e: any) { notes.push(`AI choice skipped: ${e.message}`); }
  }
  for (const t of needAi) if (!chosen.has(t.id)) chosen.set(t.id, t.candidates[0]); // plain default

  // 5. save + record ownership
  let changed = 0;
  const now = new Date().toISOString();
  for (const t of batch) {
    const kw = chosen.get(t.id);
    if (!kw || keyOf(kw) === keyOf(t.current || '')) continue;
    const { error } = await db.from(t.table).update({ focus_keyword: kw, updated_at: now }).eq('id', t.id);
    if (error) { if (/focus_keyword/i.test(error.message || '')) { notes.push('Run AUTO_PAGES_STEP4.sql first (it adds the keyword column).'); break; } continue; }
    changed++;
    if (tableReady) {
      // release the old phrase, claim the new one
      if (t.current) await db.from('seo_keywords').update({ owner_type: 'none', owner_ref: null, owner_url: null, status: 'idea', updated_at: now }).eq('keyword_key', keyOf(t.current)).eq('owner_ref', t.id);
      await db.from('seo_keywords').update({ owner_type: t.table === 'product_location_pages' ? 'product_city' : 'service_city', owner_ref: t.id, status: 'active', updated_at: now }).eq('keyword_key', keyOf(kw)).eq('owner_type', 'none');
    }
  }
  return { processed: batch.length, changed, remaining: remainingAfter, usedVolumes, usedAi, fetchedVolumes: fetched, notes };
}
