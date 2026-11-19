import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';

const KEY = 'views_baseline';

/**
 * The views counted before whole-site counting existed (the old product, service and blog counters).
 * Saved once, the first time the dashboard asks, and then never changed, so the old figure is kept and added to the new count.
 */
async function baseline(db: ReturnType<typeof adminDb>) {
  const { data: ex } = await db.from('site_settings').select('id, value').eq('key', KEY).maybeSingle();
  if (ex && typeof (ex as any).value?.views === 'number') return { views: (ex as any).value.views as number, at: (ex as any).value.at as string };
  const sum = async (t: string) => ((await db.from(t).select('view_count')).data as any[] | null || []).reduce((n, r) => n + (r.view_count || 0), 0);
  const views = (await sum('events')) + (await sum('services')) + (await sum('blog_posts'));
  const value = { views, at: new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) };
  await db.from('site_settings').insert({ key: KEY, value, description: 'Views counted before whole-site counting started' });
  return value;
}

/** POST (admin only) -> whole-site page views and unique visitors: all time, today (India date), last 7 days. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const db = adminDb();
  const base = await baseline(db).catch(() => ({ views: 0, at: '' }));
  const full = await db.rpc('site_view_stats');
  if (!full.error && full.data) return NextResponse.json({ ready: true, ...(full.data as any), views_old: base.views, views_old_at: base.at, views_total: Number((full.data as any).views_total || 0) + base.views });

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
  return NextResponse.json({ ready: false, views_old: base.views, views_old_at: base.at, views_total: total + base.views, views_today: td, views_7d: wk, views_since: since, visitors_total: null, visitors_today: null, visitors_7d: null });
}
