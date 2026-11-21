/**
 * Google rank tracking (server only). For each phrase a live page owns, asks DataForSEO where retreatarcade.in appears
 * in Google India (top 30) and stores the position, the page Google showed, and the change since the last check.
 * Cheap on purpose: a small number of phrases per run, oldest check first. Never changes any page.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { askable, dataForSeoConfigured, fetchRank } from '@/lib/dataforseo';

export type RankChange = { keyword: string; city: string | null; from: number | null; to: number | null; wrongPage: boolean };
export type RankRun = { checked: number; improved: number; dropped: number; newlyFound: number; top10: number; wrongPage: number; skipped?: string; changes: RankChange[]; ready: boolean };

const path = (u: string | null | undefined) => { try { return new URL(u || '', 'https://x.in').pathname.replace(/\/+$/, '').toLowerCase(); } catch { return String(u || '').toLowerCase(); } };

/** Checks up to `limit` phrases (never checked first, city pages every 2 days, everything else weekly). `maxMs` keeps one request inside its time. */
export async function runRankChecks(db: SupabaseClient, opts: { limit?: number; maxMs?: number } = {}): Promise<RankRun> {
  const limit = Math.min(opts.limit || 40, 60);
  const t0 = Date.now();
  const maxMs = opts.maxMs || 40000;
  const empty: RankRun = { checked: 0, improved: 0, dropped: 0, newlyFound: 0, top10: 0, wrongPage: 0, changes: [], ready: true };
  if (!dataForSeoConfigured()) return { ...empty, skipped: 'DataForSEO is not connected' };

  const probe = await db.from('seo_keywords').select('rank_position').limit(1);
  if (probe.error) return { ...empty, ready: false, skipped: 'Run AUTO_PAGES_STEP10.sql in Supabase first' };

  const { data } = await db.from('seo_keywords').select('id, keyword, keyword_key, city_slug, owner_type, owner_url, rank_position, rank_best, rank_checked_at').neq('owner_type', 'none').eq('status', 'active').limit(2000);
  const now = Date.now();
  const due = ((data as any[]) || [])
    .filter((r) => askable(r.keyword))
    .map((r) => {
      const ageDays = r.rank_checked_at ? (now - new Date(r.rank_checked_at).getTime()) / 86400000 : 999;
      const every = r.owner_type === 'city' ? 2 : 7;
      return { r, ageDays, due: ageDays >= every };
    })
    .filter((x) => x.due)
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, limit);
  if (!due.length) return { ...empty, skipped: 'Every phrase was checked recently' };

  const out: RankRun = { ...empty };
  const day = new Date(now + 5.5 * 3600e3).toISOString().slice(0, 10);
  let failure = '';
  for (let i = 0; i < due.length && Date.now() - t0 < maxMs - 6000 && !failure; i += 6) {
    await Promise.all(due.slice(i, i + 6).map(async ({ r }) => {
      try {
        const hit = await fetchRank(r.keyword);
        const prev: number | null = r.rank_position ?? null;
        const pos = hit.position;
        const wrong = !!hit.url && !!r.owner_url && path(hit.url) !== path(r.owner_url);
        const best = pos != null ? Math.min(pos, r.rank_best ?? 999) : r.rank_best ?? null;
        await db.from('seo_keywords').update({ rank_position: pos, rank_url: hit.url, rank_checked_at: new Date().toISOString(), rank_best: best, rank_previous: prev }).eq('id', r.id);
        await db.from('seo_rank_history').upsert({ keyword_key: r.keyword_key, day, position: pos, found_url: hit.url }, { onConflict: 'keyword_key,day' });
        out.checked++;
        if (pos != null && pos <= 10) out.top10++;
        if (wrong) out.wrongPage++;
        if (pos != null && prev == null && r.rank_checked_at) out.newlyFound++;
        if (pos != null && prev != null && pos < prev) out.improved++;
        if (prev != null && (pos == null || pos > prev)) out.dropped++;
        if (prev !== pos || wrong) out.changes.push({ keyword: r.keyword, city: r.city_slug, from: prev, to: pos, wrongPage: wrong });
      } catch (e: any) {
        if (/DataForSEO answered (401|402|403)|balance|credit/i.test(String(e?.message))) failure = String(e.message);
      }
    }));
  }
  if (failure) out.skipped = failure;
  return out;
}
