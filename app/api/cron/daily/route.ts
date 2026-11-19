import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/page-generator';
import { runDaily } from '@/lib/daily-run';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The daily automatic SEO run. Vercel calls this once a day (about 7 AM India time, within the hour on the Hobby plan).
 * Only allowed with CRON_SECRET, which Vercel sends by itself. Nothing is published and no title or text is rewritten.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const report = await runDaily(adminDb(), 'schedule');
  return NextResponse.json({ headline: report.headline, steps: report.steps.map((s) => ({ name: s.name, summary: s.summary })) });
}
