import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/page-generator';
import { addCandidateIdeas, fillVolumes, saveRunLog, syncOwners } from '@/lib/keywords';
import { runSmartKeywords } from '@/lib/smart-keywords';
import { dataForSeoConfigured } from '@/lib/dataforseo';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Weekly automatic SEO run. Vercel calls this on the schedule in vercel.json.
 * It is only allowed with the secret CRON_SECRET (set in Vercel), which Vercel sends automatically.
 * Steps: add phrase ideas, look up search volumes, pick better main keywords, register page ownership.
 * It never publishes pages or posts and never changes titles or text.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const started = Date.now();
  const left = () => 52000 - (Date.now() - started);
  const summary: Record<string, any> = { steps: [] };
  const db = adminDb();
  const step = async (name: string, fn: () => Promise<any>, minMs = 8000) => {
    if (left() < minMs) { summary.steps.push({ name, skipped: 'out of time, continues next run' }); return; }
    try { summary.steps.push({ name, result: await fn() }); } catch (e: any) { summary.steps.push({ name, error: String(e?.message || e).slice(0, 200) }); }
  };
  await step('ideas', async () => ({ added: await addCandidateIdeas(db) }));
  if (dataForSeoConfigured()) await step('volumes', () => fillVolumes(db, 300), 12000);
  await step('keywords', () => runSmartKeywords(db, { mode: 'weak', limit: 25 }), 15000);
  await step('register', async () => { const r = await syncOwners(db); return { added: r.added, claimed: r.claimed, clashes: r.conflicts.length }; }, 8000);
  summary.ms = Date.now() - started;
  await saveRunLog(db, summary).catch(() => null);
  return NextResponse.json(summary);
}
