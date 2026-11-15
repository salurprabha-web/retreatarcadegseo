import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Everything before a dash or bar, with other-city words removed: "Photo Booth Rental Services" */
function shortName(t: string, otherCities: string[]) {
  let s = String(t || '').split(/\s[–—|-]\s/)[0];
  for (const c of otherCities) {
    if (!c) continue;
    s = s.replace(new RegExp(`\\s*\\b(?:in|for|at)?\\s*${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ');
  }
  return s.replace(/\s{2,}/g, ' ').trim().toLowerCase();
}

/**
 * POST -> gives every Auto Pages page that has no main keyword one, built from the product (or service)
 * name and the city name people search for. No AI cost. Existing keywords are never changed.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const db = adminDb();
    const { data: locs } = await db.from('locations').select('city, alias');
    const names = (locs || []).flatMap((l: any) => [l.city, l.alias]).filter(Boolean) as string[];
    const jobs: { table: string; id: string; kw: string }[] = [];

    const prod = await db.from('product_location_pages').select('id, focus_keyword, events(title), locations(city, alias)').is('focus_keyword', null).limit(5000);
    if (prod.error) {
      if (/focus_keyword/i.test(prod.error.message || '')) return NextResponse.json({ error: 'Run AUTO_PAGES_STEP4.sql in Supabase first (it adds the keyword column).' }, { status: 400 });
      throw prod.error;
    }
    for (const r of (prod.data || []) as any[]) {
      if (!r.events?.title || !r.locations?.city) continue;
      const others = names.filter((n) => n !== r.locations.city && n !== r.locations.alias);
      jobs.push({ table: 'product_location_pages', id: r.id, kw: `${shortName(r.events.title, others)} ${String(r.locations.alias || r.locations.city).toLowerCase()}` });
    }

    const svc = await db.from('service_location_seo').select('id, focus_keyword, generated_by, services(title), locations(city, alias)').is('focus_keyword', null).not('generated_by', 'is', null).limit(5000);
    if (!svc.error) {
      for (const r of (svc.data || []) as any[]) {
        if (!r.services?.title || !r.locations?.city) continue;
        const others = names.filter((n) => n !== r.locations.city && n !== r.locations.alias);
        jobs.push({ table: 'service_location_seo', id: r.id, kw: `${shortName(r.services.title, others)} ${String(r.locations.alias || r.locations.city).toLowerCase()}` });
      }
    }

    let updated = 0;
    for (let i = 0; i < jobs.length; i += 25) {
      const res = await Promise.all(jobs.slice(i, i + 25).map((j) => db.from(j.table).update({ focus_keyword: j.kw }).eq('id', j.id).is('focus_keyword', null)));
      updated += res.filter((r) => !r.error).length;
    }
    return NextResponse.json({ updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
