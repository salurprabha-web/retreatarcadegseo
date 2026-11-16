import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { fillAllCityProfiles, fillCityProfile } from '@/lib/city-profile';

export const runtime = 'nodejs';
export const maxDuration = 60;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const list = (v: unknown) => (Array.isArray(v) ? v : String(v || '').split(/[\n,]/)).map((x) => String(x).trim()).filter(Boolean);

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const { data, error } = await adminDb().from('locations').select('*').order('city');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cities: data });
}

/**
 * POST { action: 'autofill', id }       -> fills the EMPTY fields of one city (AI, or the hand-written details)
 * POST { action: 'autofill_all' }       -> the same for every city
 * POST { id?, city, state, alias, areas, venues, nearby, local_notes, geo_lat, geo_lng, is_active }
 *      -> add or update a city. Empty profile fields are then filled automatically (send autofill:false to skip).
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json();
    const db = adminDb();

    if (b.action === 'autofill') {
      const { data: row } = await db.from('locations').select('*').eq('id', b.id).single();
      if (!row) return NextResponse.json({ error: 'City not found' }, { status: 404 });
      return NextResponse.json(await fillCityProfile(db, row));
    }
    if (b.action === 'autofill_all') return NextResponse.json({ results: await fillAllCityProfiles(db) });

    if (!b.city?.trim()) return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    const row: any = {
      city: b.city.trim(),
      state: b.state?.trim() || null,
      alias: b.alias?.trim() || null,
      areas: list(b.areas),
      venues: list(b.venues),
      nearby: list(b.nearby),
      local_notes: b.local_notes?.trim() || null,
      geo_lat: b.geo_lat === '' || b.geo_lat == null ? null : Number(b.geo_lat),
      geo_lng: b.geo_lng === '' || b.geo_lng == null ? null : Number(b.geo_lng),
      is_active: !!b.is_active,
    };
    let id: string = b.id;
    if (b.id) {
      const { error } = await db.from('locations').update(row).eq('id', b.id);
      if (error) throw error;
    } else {
      const ins = await db.from('locations').insert({ ...row, slug: slugify(b.slug || b.city) }).select('id').single();
      if (ins.error) throw ins.error;
      id = (ins.data as any).id;
    }

    // the new or edited city: fill whatever is still empty
    let fill: any = null;
    if (b.autofill !== false) {
      try {
        const { data: saved } = await db.from('locations').select('*').eq('id', id).single();
        if (saved) fill = await fillCityProfile(db, saved);
      } catch (e: any) { fill = { filled: [], source: 'none', note: String(e?.message || e).slice(0, 140) }; }
    }
    return NextResponse.json({ success: true, id, fill });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
