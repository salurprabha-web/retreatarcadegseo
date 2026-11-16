import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { suggestServices, writeProductDraft } from '@/lib/product-writer';
import { publishLaunch, runCitiesChunk } from '@/lib/launch';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MISSING = 'Run AUTO_PAGES_STEP6.sql in Supabase first (it adds the product tables).';

/**
 * POST { action, ... }  (admin only)
 *  options     -> categories and services for the form
 *  generate    { name, facts, price, category, images[], featured }  -> a DRAFT product + the AI's questions
 *  regenerate  { launchId, facts?, price?, images?, category? }       -> rewrites the draft with your answers
 *  list        -> your launches
 *  get         { launchId }    -> everything for the review screen
 *  update      { productId, fields }  quick edits of the draft (title, summary, price, meta...)
 *  publish     { launchId, serviceIds, priceOnRequest }  -> live + attached to the services
 *  cities      { launchId }    -> writes the city page drafts (call again while remaining > 0)
 *  approve     { launchId }    -> publishes this product's city page drafts
 *  discard     { launchId }    -> deletes a product that was never published
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();

    if (b.action === 'options') {
      const [{ data: cats }, { data: svc }] = await Promise.all([
        db.from('events').select('category'),
        db.from('services').select('id, title, slug, is_tech_service').eq('status', 'published').order('title'),
      ]);
      const categories = Array.from(new Set(((cats as any[]) || []).map((r) => String(r.category || '').trim()).filter(Boolean))).sort();
      const probe = await db.from('product_launches').select('id').limit(1);
      return NextResponse.json({ categories, services: ((svc as any[]) || []).filter((s) => !s.is_tech_service), ready: !probe.error });
    }

    if (b.action === 'generate') {
      const out = await writeProductDraft(db, { name: String(b.name || ''), facts: String(b.facts || ''), price: b.price === '' || b.price == null ? null : Number(b.price), category: b.category || undefined, images: Array.isArray(b.images) ? b.images : String(b.images || '').split(/\r?\n/), featured: !!b.featured });
      return NextResponse.json(out);
    }

    if (b.action === 'regenerate') {
      const { data: l } = await db.from('product_launches').select('*').eq('id', b.launchId).single();
      if (!l) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
      if ((l as any).stage !== 'draft') return NextResponse.json({ error: 'Only a draft can be rewritten.' }, { status: 400 });
      const old: any = (l as any).input || {};
      const out = await writeProductDraft(db, {
        name: String(b.name ?? old.name ?? ''), facts: String(b.facts ?? old.facts ?? ''),
        price: (b.price ?? old.price) === '' || (b.price ?? old.price) == null ? null : Number(b.price ?? old.price),
        category: b.category ?? old.category, images: Array.isArray(b.images) ? b.images : old.images || [], featured: b.featured ?? old.featured,
      }, { productId: (l as any).product_id, launchId: b.launchId });
      return NextResponse.json(out);
    }

    if (b.action === 'list') {
      const { data, error } = await db.from('product_launches').select('id, stage, cities_total, cities_done, created_at, updated_at, events(title, slug, status)').order('created_at', { ascending: false }).limit(30);
      if (error) return NextResponse.json({ launches: [], notReady: true, error: MISSING });
      return NextResponse.json({ launches: data });
    }

    if (b.action === 'get') {
      const { data: l, error } = await db.from('product_launches').select('*').eq('id', b.launchId).single();
      if (error || !l) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
      const [{ data: product }, { data: drafts }] = await Promise.all([
        db.from('events').select('*').eq('id', (l as any).product_id).single(),
        db.from('product_location_pages').select('id, status, meta_title, meta_description, focus_keyword, services(title, slug), locations(city, slug)').eq('product_id', (l as any).product_id),
      ]);
      const sug = await suggestServices(db, String((product as any)?.title || ''), String((product as any)?.category || ''));
      return NextResponse.json({ launch: l, product, cityPages: drafts || [], suggestedServiceIds: sug.all.filter((s) => s.score > 0).slice(0, 3).map((s) => s.id) });
    }

    if (b.action === 'update') {
      const allowed: Record<string, any> = {};
      const f = b.fields || {};
      for (const k of ['title', 'summary', 'meta_title', 'meta_description', 'category']) if (k in f) allowed[k] = String(f[k] ?? '').trim();
      if ('price' in f) allowed.price = f.price === '' || f.price == null ? null : Number(f.price);
      if ('is_featured' in f) allowed.is_featured = !!f.is_featured;
      if ('highlights' in f && Array.isArray(f.highlights)) allowed.highlights = f.highlights.map((h: any) => String(h).trim()).filter(Boolean);
      if ('faqs' in f && Array.isArray(f.faqs)) allowed.faqs = f.faqs.map((x: any) => ({ q: String(x.q || '').trim(), a: String(x.a || '').trim() })).filter((x: any) => x.q && x.a);
      if ('description' in f) allowed.description = String(f.description || '');
      // only drafts can be edited here; live products are edited in Products
      const { error } = await db.from('events').update({ ...allowed, updated_at: new Date().toISOString() }).eq('id', b.productId).eq('status', 'draft');
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (b.action === 'publish') {
      return NextResponse.json(await publishLaunch(db, b.launchId, { serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds : [], priceOnRequest: !!b.priceOnRequest }));
    }

    if (b.action === 'cities') {
      return NextResponse.json(await runCitiesChunk(db, b.launchId, 40000));
    }

    if (b.action === 'approve') {
      const { data: l } = await db.from('product_launches').select('product_id').eq('id', b.launchId).single();
      if (!l) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
      const now = new Date().toISOString();
      const { data, error } = await db.from('product_location_pages').update({ status: 'published', approved_at: now, updated_at: now }).eq('product_id', (l as any).product_id).in('status', ['draft', 'approved']).select('id');
      if (error) throw error;
      return NextResponse.json({ published: (data || []).length });
    }

    if (b.action === 'discard') {
      const { data: l } = await db.from('product_launches').select('product_id, stage').eq('id', b.launchId).single();
      if (!l) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
      if ((l as any).stage !== 'draft') return NextResponse.json({ error: 'A published product cannot be discarded here.' }, { status: 400 });
      const { error } = await db.from('events').delete().eq('id', (l as any).product_id).eq('status', 'draft');
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
