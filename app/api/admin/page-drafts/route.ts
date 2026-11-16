import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { syncOwners } from '@/lib/keywords';

export const runtime = 'nodejs';

const TABLES = { service_city: 'service_location_seo', product_city: 'product_location_pages' } as const;

/** GET -> every generated page that still waits for approval */
export async function GET(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const db = adminDb();
  const [svc, prod, cityRes, upg] = await Promise.all([
    db.from('service_location_seo').select('*, services(title, slug), locations(city, slug)').in('status', ['draft', 'approved']).order('generated_at', { ascending: false }),
    db.from('product_location_pages').select('*, services(title, slug), locations(city, slug), events(title, slug)').in('status', ['draft', 'approved']).order('generated_at', { ascending: false }),
    db.from('locations').select('id, city, slug, is_active, page_status, page_content').eq('page_status', 'draft'),
    db.from('service_location_seo').select('*, services(title, slug), locations(city, slug)').not('extras->draft', 'is', null),
  ]);
  if (svc.error || prod.error) return NextResponse.json({ error: (svc.error || prod.error)!.message }, { status: 500 });
  // city landing pages are optional (the columns exist only after AUTO_PAGES_STEP2.sql)
  const cities = (cityRes.data || []).map((c: any) => ({
    id: c.id,
    kind: 'city_page',
    status: 'draft',
    meta_title: c.page_content?.meta_title || '',
    meta_description: c.page_content?.meta_description || '',
    focus_keyword: c.page_content?.focus_keyword || '',
    intro: Array.isArray(c.page_content?.intro) ? c.page_content.intro.join('\n\n') : '',
    faqs: c.page_content?.faqs || [],
    generated_at: c.page_content?.generated_at,
    locations: { city: c.city, slug: c.slug },
    city_live: !!c.is_active,
  }));
  return NextResponse.json({
    drafts: [
      ...cities,
      ...(upg.data || []).map((r: any) => ({ ...r, ...(r.extras?.draft || {}), kind: 'service_city', status: 'approved', upgrade: true })),
      ...(svc.data || []).map((r: any) => ({ ...r, kind: 'service_city' })),
      ...(prod.data || []).map((r: any) => ({ ...r, kind: 'product_city' })),
    ],
  });
}

async function handleOrdinary(db: any, table: string, kind: string, action: string, ids: string[], now: string) {
  if (action === 'publish') {
    const { error } = await db.from(table).update({ status: 'published', ...(kind === 'product_city' ? { approved_at: now } : {}), updated_at: now }).in('id', ids).in('status', ['draft', 'approved']);
    if (error) throw error;
  } else {
    const { error } = await db.from(table).delete().in('id', ids).in('status', ['draft', 'approved']);
    if (error) throw error;
  }
  return NextResponse.json({ success: true });
}

const cleanFaqs = (v: any) => (Array.isArray(v) ? v : []).map((f: any) => ({ q: String(f?.q || '').trim(), a: String(f?.a || '').trim() })).filter((f: any) => f.q && f.a);

/** POST { action: 'publish' | 'reject' | 'edit', kind, ids?: string[], id?, fields? }
 *  'edit' works on drafts AND on published pages made by Auto Pages (never on hand-made pages). */
export async function POST(req: Request) {
  const peek = await req.clone().json().catch(() => ({}));
  const res = await handle(req);
  // as soon as pages go live, record which page owns which phrase (best effort; the weekly run also does this)
  if (peek?.action === 'publish' && res.status === 200 && peek?.kind !== 'city_page') {
    try { await syncOwners(adminDb()); } catch { /* not critical */ }
  }
  return res;
}

async function handle(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const { action, kind, ids, id, fields, upgrade } = await req.json();
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
        const { data: row } = await db.from('locations').select('page_content').eq('id', id).in('page_status', ['draft', 'published']).single();
        if (!row) throw new Error('Page not found');
        const c: any = { ...(row.page_content || {}) };
        if (fields?.meta_title != null) c.meta_title = fields.meta_title;
        if (fields?.meta_description != null) c.meta_description = fields.meta_description;
        if (fields?.focus_keyword != null) c.focus_keyword = String(fields.focus_keyword).trim().toLowerCase();
        if (fields?.intro != null) c.intro = String(fields.intro).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        if (fields?.faqs != null) c.faqs = cleanFaqs(fields.faqs);
        const { error } = await db.from('locations').update({ page_content: c }).eq('id', id);
        if (error) throw error;
      } else {
        return NextResponse.json({ error: 'Bad action' }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const table = TABLES[kind as keyof typeof TABLES];
    if (!table) return NextResponse.json({ error: 'Bad kind' }, { status: 400 });

    // Upgrade drafts of existing service-in-city pages live in extras.draft until published
    if (kind === 'service_city') {
      const { data: upRows } = await db.from('service_location_seo').select('id, extras').in('id', (action === 'edit' ? [id] : ids) || []).not('extras->draft', 'is', null);
      const upIds = new Set((upRows || []).map((r: any) => r.id));
      if (action === 'edit' && upgrade && upIds.has(id)) {
        const row: any = (upRows || [])[0];
        const d = { ...(row.extras?.draft || {}) };
        for (const k of ['meta_title', 'meta_description', 'intro']) if (fields && k in fields) d[k] = String(fields[k] || '').trim();
        if (fields && 'faqs' in fields) d.faqs = cleanFaqs(fields.faqs);
        if (fields && 'focus_keyword' in fields) d.focus_keyword = String(fields.focus_keyword || '').trim().toLowerCase();
        const { error } = await db.from(table).update({ extras: { ...(row.extras || {}), draft: d } }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
      if ((action === 'publish' || action === 'reject') && upIds.size) {
        for (const row of (upRows || []) as any[]) {
          const { draft, ...restExtras } = row.extras || {};
          if (action === 'publish') {
            const base: Record<string, any> = { meta_title: draft.meta_title, meta_description: draft.meta_description, intro: draft.intro, faqs: draft.faqs, generated_by: draft.generated_by, generated_at: draft.generated_at, status: 'published', extras: restExtras, updated_at: now };
            let r = await db.from(table).update({ ...base, focus_keyword: draft.focus_keyword || null }).eq('id', row.id);
            if (r.error && /focus_keyword/i.test(r.error.message || '')) r = await db.from(table).update(base).eq('id', row.id);
            if (r.error) throw r.error;
          } else {
            const { error } = await db.from(table).update({ extras: restExtras }).eq('id', row.id);
            if (error) throw error;
          }
        }
        // anything left in the list is an ordinary draft; fall through for those
        const rest = (ids || []).filter((x: string) => !upIds.has(x));
        if (!rest.length) return NextResponse.json({ success: true });
        return await handleOrdinary(db, table, kind, action, rest, now);
      }
    }

    if (action === 'publish') {
      const { error } = await db.from(table).update({ status: 'published', ...(kind === 'product_city' ? { approved_at: now } : {}), updated_at: now }).in('id', ids || []).in('status', ['draft', 'approved']);
      if (error) throw error;
    } else if (action === 'reject') {
      // only rows that were never published can be removed; live pages are untouched
      const { error } = await db.from(table).delete().in('id', ids || []).in('status', ['draft', 'approved']);
      if (error) throw error;
    } else if (action === 'edit') {
      const allowed: Record<string, any> = {};
      if (fields && 'meta_title' in fields) allowed.meta_title = String(fields.meta_title || '').trim();
      if (fields && 'meta_description' in fields) allowed.meta_description = String(fields.meta_description || '').trim();
      if (fields && 'intro' in fields) allowed.intro = String(fields.intro || '').trim();
      if (fields && 'faqs' in fields) allowed.faqs = cleanFaqs(fields.faqs);
      if (fields && 'focus_keyword' in fields) allowed.focus_keyword = String(fields.focus_keyword || '').trim().toLowerCase();
      // hand-made rows (no generated_by) are never edited from here
      const { error } = await db.from(table).update({ ...allowed, updated_at: now }).eq('id', id).not('generated_by', 'is', null);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Bad action' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
