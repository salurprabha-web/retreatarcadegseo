import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { suggestCaseTitles, tidyCaseStudy } from '@/lib/case-writer';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MISSING = 'Run AUTO_PAGES_STEP7.sql in Supabase first (it creates the case studies table).';
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

/**
 * POST { action, ... }  (admin only)
 *  options  -> cities and products for the form
 *  list     -> all case studies (draft and published)
 *  get      { id }
 *  save     { id?, fields }   creates or updates a DRAFT-or-published study (publishing is a separate action)
 *  tidy     { fields }        AI tidies your notes into a story and writes picture text (nothing is saved)
 *  publish / unpublish { id }
 *  delete   { id }
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();

    if (b.action === 'options') {
      const [{ data: cities }, { data: products }] = await Promise.all([
        db.from('locations').select('slug, city, alias').order('city'),
        db.from('events').select('slug, title').eq('status', 'published').order('title'),
      ]);
      const probe = await db.from('case_studies').select('id').limit(1);
      return NextResponse.json({ cities: cities || [], products: products || [], ready: !probe.error });
    }

    if (b.action === 'list') {
      const { data, error } = await db.from('case_studies').select('id, slug, title, city_slug, event_type, status, published_at, updated_at, photos').order('updated_at', { ascending: false }).limit(200);
      if (error) return NextResponse.json({ items: [], notReady: true, error: MISSING });
      return NextResponse.json({ items: data });
    }

    if (b.action === 'get') {
      const { data, error } = await db.from('case_studies').select('*').eq('id', b.id).single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === 'titles') {
      const f = b.fields || {};
      const { data: city } = f.city_slug ? await db.from('locations').select('city').eq('slug', f.city_slug).maybeSingle() : { data: null as any };
      const { data: prods } = (f.product_slugs || []).length ? await db.from('events').select('title').in('slug', f.product_slugs) : { data: [] as any[] };
      const titles = await suggestCaseTitles({
        title: String(f.title || ''), cityName: (city as any)?.city, area: f.area, eventType: f.event_type, eventDate: f.event_date, guests: f.guests,
        productNames: ((prods as any[]) || []).map((p) => String(p.title).trim()), notes: String(f.notes || ''),
        photos: (Array.isArray(f.photos) ? f.photos : []).map((p: any) => ({ url: String(p.url || ''), note: String(p.note || p.alt || '') })),
      });
      return NextResponse.json({ titles });
    }

    if (b.action === 'tidy') {
      const f = b.fields || {};
      const { data: city } = f.city_slug ? await db.from('locations').select('city').eq('slug', f.city_slug).maybeSingle() : { data: null as any };
      const { data: prods } = (f.product_slugs || []).length ? await db.from('events').select('title').in('slug', f.product_slugs) : { data: [] as any[] };
      const out = await tidyCaseStudy({
        title: String(f.title || ''), cityName: (city as any)?.city, area: f.area, eventType: f.event_type, eventDate: f.event_date, guests: f.guests,
        productNames: ((prods as any[]) || []).map((p) => String(p.title).trim()), notes: String(f.notes || ''),
        photos: (Array.isArray(f.photos) ? f.photos : []).map((p: any) => ({ url: String(p.url || ''), note: String(p.note || p.alt || '') })),
      });
      return NextResponse.json(out);
    }

    if (b.action === 'save') {
      const f = b.fields || {};
      if (!String(f.title || '').trim()) return NextResponse.json({ error: 'Give the case study a title.' }, { status: 400 });
      const photos = (Array.isArray(f.photos) ? f.photos : []).filter((p: any) => /^https:\/\/\S+$/i.test(String(p?.url || ''))).map((p: any) => ({ url: String(p.url).trim(), alt: String(p.alt || '').trim(), caption: String(p.caption || '').trim() }));
      const row: Record<string, any> = {
        title: String(f.title).trim(),
        city_slug: f.city_slug || null,
        area: f.area?.trim() || null,
        event_type: f.event_type || null,
        event_date: f.event_date || null,
        guests: f.guests?.trim() || null,
        product_slugs: Array.isArray(f.product_slugs) ? f.product_slugs : [],
        notes: f.notes || null,
        story: f.story || null,
        photos,
        quote_text: f.quote_text?.trim() || null,
        quote_name: f.quote_name?.trim() || null,
        quote_role: f.quote_role?.trim() || null,
        quote_approved: !!f.quote_approved,
        client_name: f.client_name?.trim() || null,
        meta_title: f.meta_title?.trim() || null,
        meta_description: f.meta_description?.trim() || null,
        focus_keyword: f.focus_keyword?.trim().toLowerCase() || null,
        updated_at: new Date().toISOString(),
      };
      if (b.id) {
        const { error } = await db.from('case_studies').update(row).eq('id', b.id);
        if (error) throw error;
        return NextResponse.json({ id: b.id });
      }
      let slug = slugify(`${row.title}`);
      for (let n = 2; ; n++) {
        const { data: ex } = await db.from('case_studies').select('id').eq('slug', slug).maybeSingle();
        if (!ex) break;
        slug = `${slugify(row.title)}-${n}`;
      }
      const ins = await db.from('case_studies').insert({ ...row, slug, status: 'draft' }).select('id').single();
      if (ins.error) {
        if (/case_studies/i.test(ins.error.message || '')) return NextResponse.json({ error: MISSING }, { status: 400 });
        throw ins.error;
      }
      return NextResponse.json({ id: (ins.data as any).id });
    }

    if (b.action === 'publish') {
      const { data: cs } = await db.from('case_studies').select('title, story, photos, quote_text, quote_approved').eq('id', b.id).single();
      if (!cs) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const c: any = cs;
      if (!c.story || String(c.story).trim().length < 60) return NextResponse.json({ error: 'Write the story first (a few sentences, or use "Tidy with AI").' }, { status: 400 });
      if (!Array.isArray(c.photos) || !c.photos.length) return NextResponse.json({ error: 'Add at least one picture.' }, { status: 400 });
      if ((c.photos as any[]).some((p) => !String(p.alt || '').trim())) return NextResponse.json({ error: 'Every picture needs alt text (what it shows). "Tidy with AI" writes it.' }, { status: 400 });
      const now = new Date().toISOString();
      const { error } = await db.from('case_studies').update({ status: 'published', published_at: now, updated_at: now }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (b.action === 'unpublish') {
      const { error } = await db.from('case_studies').update({ status: 'draft', updated_at: new Date().toISOString() }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (b.action === 'delete') {
      const { error } = await db.from('case_studies').delete().eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
