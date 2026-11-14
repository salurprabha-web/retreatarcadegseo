import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';

const TABLES = { service_city: 'service_location_seo', product_city: 'product_location_pages' } as const;

/** GET -> every generated page that still waits for approval */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const db = adminDb();
  const [svc, prod, cityRes] = await Promise.all([
    db.from('service_location_seo').select('id, meta_title, meta_description, intro, faqs, status, generated_at, services(title, slug), locations(city, slug)').in('status', ['draft', 'approved']).order('generated_at', { ascending: false }),
    db.from('product_location_pages').select('id, meta_title, meta_description, intro, faqs, status, generated_at, services(title, slug), locations(city, slug), events(title, slug)').in('status', ['draft', 'approved']).order('generated_at', { ascending: false }),
    db.from('locations').select('id, city, slug, is_active, page_status, page_content').eq('page_status', 'draft'),
  ]);
  if (svc.error || prod.error) return NextResponse.json({ error: (svc.error || prod.error)!.message }, { status: 500 });
  // city landing pages are optional (the columns exist only after AUTO_PAGES_STEP2.sql)
  const cities = (cityRes.data || []).map((c: any) => ({
    id: c.id,
    kind: 'city_page',
    status: 'draft',
    meta_title: c.page_content?.meta_title || '',
    meta_description: c.page_content?.meta_description || '',
    intro: Array.isArray(c.page_content?.intro) ? c.page_content.intro.join('\n\n') : '',
    faqs: c.page_content?.faqs || [],
    generated_at: c.page_content?.generated_at,
    locations: { city: c.city, slug: c.slug },
    city_live: !!c.is_active,
  }));
  return NextResponse.json({
    drafts: [
      ...cities,
      ...(svc.data || []).map((r: any) => ({ ...r, kind: 'service_city' })),
      ...(prod.data || []).map((r: any) => ({ ...r, kind: 'product_city' })),
    ],
  });
}

/** POST { action: 'publish' | 'reject' | 'edit', kind, ids?: string[], id?, fields? } */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const { action, kind, ids, id, fields } = await req.json();
    const db = adminDb();
    const now = new Date().toISOString();

    if (kind === 'city_page') {
      if (action === 'publish') {
        const { error } = await db.from('locations').update({ page_status: 'published' }).in('id', ids || []).eq('page_status', 'draft');
        if (error) throw error;
      } else if (action === 'reject') {
        const { error } = await db.from('locations').update({ page_status: 'none', page_content: {} }).in('id', ids || []).eq('page_status', 'draft');
        if (error) throw error;
      } else if (action === 'edit') {
        const { data: row } = await db.from('locations').select('page_content').eq('id', id).eq('page_status', 'draft').single();
        if (!row) throw new Error('Draft not found');
        const c: any = { ...(row.page_content || {}) };
        if (fields?.meta_title != null) c.meta_title = fields.meta_title;
        if (fields?.meta_description != null) c.meta_description = fields.meta_description;
        if (fields?.intro != null) c.intro = String(fields.intro).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        const { error } = await db.from('locations').update({ page_content: c }).eq('id', id);
        if (error) throw error;
      } else {
        return NextResponse.json({ error: 'Bad action' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const table = TABLES[kind as keyof typeof TABLES];
    if (!table) return NextResponse.json({ error: 'Bad kind' }, { status: 400 });

    if (action === 'publish') {
      const { error } = await db.from(table).update({ status: 'published', ...(kind === 'product_city' ? { approved_at: now } : {}), updated_at: now }).in('id', ids || []).in('status', ['draft', 'approved']);
      if (error) throw error;
    } else if (action === 'reject') {
      // only rows that were never published can be removed; live pages are untouched
      const { error } = await db.from(table).delete().in('id', ids || []).in('status', ['draft', 'approved']);
      if (error) throw error;
    } else if (action === 'edit') {
      const allowed: Record<string, any> = {};
      for (const k of ['meta_title', 'meta_description', 'intro', 'faqs']) if (fields && k in fields) allowed[k] = fields[k];
      const { error } = await db.from(table).update({ ...allowed, updated_at: now }).eq('id', id).in('status', ['draft', 'approved']);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Bad action' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
