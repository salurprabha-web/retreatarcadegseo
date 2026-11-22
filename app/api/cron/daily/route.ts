import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/page-generator';
import { readRuns, runDaily } from '@/lib/daily-run';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The daily automatic SEO run. Vercel calls this once a day (about 7 AM India time, within the hour on the Hobby plan).
 * Only allowed with CRON_SECRET, which Vercel sends by itself. Nothing is published and no title or text is rewritten.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const db = adminDb();
  // two timers call this (Vercel and a GitHub backup): the second one finds the run already done and stops
  const lastScheduled = (await readRuns(db).catch(() => [])).find((r) => r.trigger === 'schedule');
  if (lastScheduled && Date.now() - new Date(lastScheduled.at).getTime() < 18 * 3600e3) return NextResponse.json({ skipped: 'Already ran in the last 18 hours', at: lastScheduled.at });
  const report = await runDaily(db, 'schedule');
  return NextResponse.json({ headline: report.headline, steps: report.steps.map((s) => ({ name: s.name, summary: s.summary })) });
}
