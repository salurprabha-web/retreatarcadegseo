/**
 * The phrase a page should lead with: the most-searched of the phrases people really type for it.
 * Works with search volumes from DataForSEO when connected; otherwise returns the plain default.
 * Phrases are stored in the keyword list as free ideas (never claimed here).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { dataForSeoConfigured, fetchSearchVolumes } from '@/lib/dataforseo';
import { makeCandidates } from '@/lib/smart-keywords';
import { keyOf } from '@/lib/keywords';

export type Lead = { phrase: string; volume: number | null; known: boolean; options: { phrase: string; volume: number | null }[] };

/** items: id, the product/service name, and the city words to build with (use [''] for a page with no city). */
export async function leadPhrasesFor(db: SupabaseClient, items: { id: string; name: string; cityNames: string[] }[]): Promise<Map<string, Lead>> {
  const out = new Map<string, Lead>();
  const cand = new Map<string, string[]>();
  for (const it of items) cand.set(it.id, makeCandidates(it.name, it.cityNames.length ? it.cityNames : ['']).slice(0, 14));
  const all = Array.from(new Set(Array.from(cand.values()).flat()));

  const vol = new Map<string, number | null>();
  const probe = await db.from('seo_keywords').select('id').limit(1);
  if (!probe.error && all.length) {
    const read = async () => {
      for (let i = 0; i < all.length; i += 150) {
        const { data } = await db.from('seo_keywords').select('keyword_key, volume').in('keyword_key', all.slice(i, i + 150).map(keyOf));
        (data || []).forEach((r: any) => vol.set(r.keyword_key, r.volume));
      }
    };
    await read();
    const fresh = all.filter((p) => !vol.has(keyOf(p)));
    for (let i = 0; i < fresh.length; i += 200) await db.from('seo_keywords').insert(fresh.slice(i, i + 200).map((p) => ({ keyword: p, source: 'auto', status: 'idea', owner_type: 'none', intent: 'buy' })));
    if (dataForSeoConfigured()) {
      await read();
      const need = all.filter((p) => vol.get(keyOf(p)) == null).slice(0, 600);
      if (need.length) {
        try {
          const vols = await fetchSearchVolumes(need);
          const byKey = new Map(vols.map((v) => [keyOf(v.keyword), v]));
          const now = new Date().toISOString();
          for (const p of need) {
            const v = byKey.get(keyOf(p));
            await db.from('seo_keywords').update({ volume: v?.volume ?? 0, competition: v?.competition ?? null, cpc: v?.cpc ?? null, source: 'dataforseo', fetched_at: now, updated_at: now }).eq('keyword_key', keyOf(p));
            vol.set(keyOf(p), v?.volume ?? 0);
          }
        } catch { /* volumes are a bonus: carry on without */ }
      }
    }
  }
  for (const it of items) {
    const ranked = (cand.get(it.id) || []).map((p) => ({ phrase: p, volume: vol.get(keyOf(p)) ?? null })).sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1) || a.phrase.length - b.phrase.length);
    const best = ranked[0];
    out.set(it.id, best ? { phrase: best.phrase, volume: best.volume, known: (best.volume ?? 0) > 0, options: ranked.slice(0, 5) } : { phrase: it.name.toLowerCase(), volume: null, known: false, options: [] });
  }
  return out;
}
