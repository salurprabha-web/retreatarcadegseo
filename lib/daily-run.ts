/**
 * The daily automatic SEO run (server only). It runs at about 7 AM India time (Vercel starts it inside that hour)
 * and can also be started by hand from the Keywords screen. It never publishes pages or posts and never rewrites
 * titles or text. Every run is written to a history you can read in the admin.
 *
 * Each step is small so the whole run fits in the time a server request is allowed (about a minute); anything that
 * does not finish continues in the next run.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { addCandidateIdeas, fillVolumes, syncOwners } from '@/lib/keywords';
import { runSmartKeywords } from '@/lib/smart-keywords';
import { dataForSeoConfigured } from '@/lib/dataforseo';
import { fillAllCityProfiles } from '@/lib/city-profile';
import { openLaunches, runCitiesChunk } from '@/lib/launch';

export type RunStep = { name: string; label: string; ok: boolean; skipped?: string; summary: string; details?: any };
export type RunReport = {
  id: string; at: string; trigger: 'schedule' | 'manual'; ms: number; steps: RunStep[];
  headline: string; problems: string[]; changes: { page: string; city: string; from: string | null; to: string; volume: number | null }[];
};

const HISTORY_KEY = 'seo_run_history';

export async function readRuns(db: SupabaseClient): Promise<RunReport[]> {
  const { data } = await db.from('site_settings').select('value').eq('key', HISTORY_KEY).maybeSingle();
  const v: any = (data as any)?.value;
  return Array.isArray(v?.runs) ? v.runs : [];
}

async function saveRuns(db: SupabaseClient, runs: RunReport[]) {
  const value = { runs: runs.slice(0, 30) };
  const { data: ex } = await db.from('site_settings').select('id').eq('key', HISTORY_KEY).maybeSingle();
  if (ex) await db.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('id', (ex as any).id);
  else await db.from('site_settings').insert({ key: HISTORY_KEY, value, description: 'History of the automatic SEO runs' });
}

export async function runDaily(db: SupabaseClient, trigger: 'schedule' | 'manual' = 'schedule'): Promise<RunReport> {
  const started = Date.now();
  const left = () => 52000 - (Date.now() - started);
  const steps: RunStep[] = [];
  const problems: string[] = [];
  let changes: RunReport['changes'] = [];
  // Monday (India time): also add new phrase ideas
  const istDay = new Date(Date.now() + 5.5 * 3600e3).getUTCDay();

  const step = async (name: string, label: string, minMs: number, fn: () => Promise<{ summary: string; details?: any }>) => {
    if (left() < minMs) { steps.push({ name, label, ok: true, skipped: 'ran out of time today, continues tomorrow', summary: 'Continues tomorrow.' }); return; }
    try { const r = await fn(); steps.push({ name, label, ok: true, summary: r.summary, details: r.details }); }
    catch (e: any) { const m = String(e?.message || e).slice(0, 200); steps.push({ name, label, ok: false, summary: `Problem: ${m}` }); problems.push(`${label}: ${m}`); }
  };

  await step('cities', 'City details', 15000, async () => {
    const r = await fillAllCityProfiles(db);
    const done = r.filter((x) => x.filled.length);
    return { summary: done.length ? `Filled the empty details of ${done.map((x) => x.city).join(', ')}.` : 'All cities already complete.', details: done };
  });

  await step('launches', 'Product launches', 15000, async () => {
    const ids = await openLaunches(db);
    if (!ids.length) return { summary: 'No half-finished product launches.' };
    let made = 0;
    for (const id of ids) { if (left() < 20000) break; const r = await runCitiesChunk(db, id, Math.max(left() - 15000, 8000)); made += r.made; }
    return { summary: `Wrote ${made} city page drafts for products you launched. They wait for your approval.` };
  });

  if (dataForSeoConfigured()) {
    await step('volumes', 'Search volumes', 12000, async () => {
      const r = await fillVolumes(db, 300);
      return { summary: r.asked ? `Looked up monthly searches for ${r.updated} phrases.` : 'Every phrase already has its search volume.' };
    });
  } else steps.push({ name: 'volumes', label: 'Search volumes', ok: true, skipped: 'DataForSEO is not connected', summary: 'Skipped: DataForSEO is not connected.' });

  await step('keywords', 'Page keywords', 15000, async () => {
    const r = await runSmartKeywords(db, { mode: 'missing', limit: 12 });
    changes = r.changes || [];
    r.notes.forEach((n) => problems.push(`Page keywords: ${n}`));
    return { summary: r.processed ? `Chose the main keyword for ${r.changed} of ${r.processed} pages. ${r.remaining} still waiting for tomorrow.` : 'Every main page already has a keyword.', details: { changed: r.changed, remaining: r.remaining } };
  });

  await step('register', 'Keyword owners', 8000, async () => {
    const r = await syncOwners(db);
    return { summary: `Registered ${r.added} new phrases, claimed ${r.claimed}, updated ${r.updated}.${r.conflicts.length ? ` ${r.conflicts.length} phrases are wanted by two pages (see the Keywords screen).` : ''}`, details: { clashes: r.conflicts.slice(0, 20) } };
  });

  if (istDay === 1 || trigger === 'manual') {
    await step('ideas', 'Phrase ideas', 8000, async () => ({ summary: `Added ${await addCandidateIdeas(db)} new phrase ideas for your cities.` }));
  }

  const done = steps.filter((s) => s.ok && !s.skipped).length;
  const report: RunReport = {
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    trigger,
    ms: Date.now() - started,
    steps,
    changes,
    problems,
    headline: problems.length ? `${done} steps done, ${problems.length} problem${problems.length > 1 ? 's' : ''}` : `${done} steps done, no problems`,
  };
  try { await saveRuns(db, [report, ...(await readRuns(db))]); } catch { /* the report is still returned */ }
  return report;
}
