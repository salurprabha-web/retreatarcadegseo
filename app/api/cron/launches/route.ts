import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/page-generator';
import { openLaunches, runCitiesChunk } from '@/lib/launch';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily catch-up: finishes city pages for any product launch that was left half-done (for example the page was closed).
 * Only runs with CRON_SECRET, which Vercel sends automatically. It writes DRAFTS only; nothing is published here.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const started = Date.now();
  const db = adminDb();
  const out: any[] = [];
  for (const id of await openLaunches(db)) {
    const left = 50000 - (Date.now() - started);
    if (left < 12000) break;
    try { out.push({ id, ...(await runCitiesChunk(db, id, left - 8000)) }); } catch (e: any) { out.push({ id, error: String(e?.message || e).slice(0, 160) }); }
  }
  return NextResponse.json({ launches: out });
}
