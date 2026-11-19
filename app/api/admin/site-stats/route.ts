import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';

/** POST (admin only) -> whole-site page views and unique visitors: all time, today (India date), last 7 days. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const db = adminDb();
  const full = await db.rpc('site_view_stats');
  if (!full.error && full.data) return NextResponse.json({ ready: true, ...(full.data as any) });

  // STEP9 not run yet: page views can still be read from the STEP3 table, visitors cannot
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  const week = new Date(Date.now() + 5.5 * 3600 * 1000 - 6 * 86400000).toISOString().slice(0, 10);
  const rows = await db.from('page_view_counts').select('day, views').limit(100000);
  if (rows.error) return NextResponse.json({ ready: false });
  let total = 0, td = 0, wk = 0, since: string | null = null;
  for (const r of (rows.data as any[]) || []) {
    total += r.views; if (r.day === today) td += r.views; if (r.day >= week) wk += r.views;
    if (!since || r.day < since) since = r.day;
  }
  return NextResponse.json({ ready: false, views_total: total, views_today: td, views_7d: wk, views_since: since, visitors_total: null, visitors_today: null, visitors_7d: null });
}
