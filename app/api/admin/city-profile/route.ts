import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const list = (v: unknown) => (Array.isArray(v) ? v : String(v || '').split(/[\n,]/)).map((x) => String(x).trim()).filter(Boolean);

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const { data, error } = await adminDb().from('locations').select('*').order('city');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cities: data });
}

/** POST { id?, city, state, alias, areas, venues, nearby, local_notes, geo_lat, geo_lng, is_active } -> add or update a city */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json();
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
    const db = adminDb();
    if (b.id) {
      const { error } = await db.from('locations').update(row).eq('id', b.id);
      if (error) throw error;
    } else {
      const { error } = await db.from('locations').insert({ ...row, slug: slugify(b.slug || b.city) });
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
