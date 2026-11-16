import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { tokens } from '@/lib/primary-pick';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** "Photobooth", "Photo Booths", " Photo Booths" are one category. */
const catKey = (c: string) => String(c || '').toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '');

/**
 * POST { action } (admin only)
 *  scan  -> published products that are in NO service (so Auto Pages skips them), each with suggested services
 *  apply { items: [{ productId, serviceIds: [] }] } -> adds the products to those services' product lists
 *
 * Suggestions copy YOUR existing pattern: a service is suggested for a category when at least half of the
 * products of that category that you already attached are in that service. Categories with no examples fall back
 * to the closest name match.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();

    const [{ data: ev }, { data: sv }] = await Promise.all([
      db.from('events').select('id, title, slug, category').eq('status', 'published').order('title'),
      db.from('services').select('id, title, slug, related_event_ids, is_tech_service, display_order').eq('status', 'published'),
    ]);
    const products = (ev as any[]) || [];
    const services = ((sv as any[]) || []).filter((s) => !s.is_tech_service);
    const attached = new Set<string>();
    services.forEach((s) => (s.related_event_ids || []).forEach((i: string) => attached.add(i)));

    if (b.action === 'scan') {
      const byId = new Map(products.map((p) => [p.id, p]));
      // how your attached products are spread across services, per category
      const examples = new Map<string, number>();
      const membership = new Map<string, Map<string, number>>();
      for (const s of services) {
        for (const pid of (s.related_event_ids || []) as string[]) {
          const p = byId.get(pid);
          if (!p) continue;
          const k = catKey(p.category);
          examples.set(k, (examples.get(k) || 0) + 0);
          if (!membership.has(k)) membership.set(k, new Map());
          membership.get(k)!.set(s.id, (membership.get(k)!.get(s.id) || 0) + 1);
        }
      }
      const perCat = new Map<string, number>();
      products.filter((p) => attached.has(p.id)).forEach((p) => perCat.set(catKey(p.category), (perCat.get(catKey(p.category)) || 0) + 1));

      const rows = products.filter((p) => !attached.has(p.id)).map((p) => {
        const k = catKey(p.category);
        const total = perCat.get(k) || 0;
        const isBooth = k.startsWith('photobooth');
        // a photo booth service is not suggested for games and other non-booth products
        const okFor = (s: any) => isBooth || !/photo\s?-?booth/i.test(s.title);
        const pt = tokens(`${p.title} ${p.category}`);
        const scored = services.filter(okFor).map((s) => { let n = 0; tokens(s.title).forEach((w) => pt.has(w) && n++); return { s, n }; }).filter((x) => x.n > 0).sort((a, b2) => b2.n - a.n);
        let suggested: string[] = [];
        let reason = '';
        if (total >= 2) {
          suggested = services.filter((s) => okFor(s) && (membership.get(k)?.get(s.id) || 0) / total >= 0.5).map((s) => s.id);
          reason = `like your other ${String(p.category || '').trim() || 'similar'} products (${total} already attached)`;
        }
        // always include the closest name match too (for example "Interactive Games Rental" for games)
        if (scored[0] && !suggested.includes(scored[0].s.id)) {
          suggested.push(scored[0].s.id);
          reason = reason ? `${reason}, plus the closest name match` : 'closest match by name';
        }
        if (!suggested.length) reason = 'no clear match: please choose';
        return { id: p.id, title: String(p.title).trim(), category: String(p.category || '').trim(), suggested, reason };
      });
      return NextResponse.json({ products: rows, total: products.length, attached: products.length - rows.length, services: services.map((s) => ({ id: s.id, title: String(s.title).trim(), count: (s.related_event_ids || []).length })) });
    }

    if (b.action === 'apply') {
      const items: { productId: string; serviceIds: string[] }[] = Array.isArray(b.items) ? b.items : [];
      const valid = new Set(products.map((p) => p.id));
      const add = new Map<string, Set<string>>(); // service id -> product ids to add
      let pairs = 0;
      for (const it of items) {
        if (!valid.has(it.productId)) continue;
        for (const sid of it.serviceIds || []) {
          if (!services.some((s) => s.id === sid)) continue;
          if (!add.has(sid)) add.set(sid, new Set());
          add.get(sid)!.add(it.productId);
          pairs++;
        }
      }
      const now = new Date().toISOString();
      let services_updated = 0;
      for (const [sid, ids] of Array.from(add.entries())) {
        const s = services.find((x) => x.id === sid)!;
        const cur: string[] = Array.isArray(s.related_event_ids) ? s.related_event_ids : [];
        const merged = Array.from(new Set([...cur, ...Array.from(ids)]));
        if (merged.length === cur.length) continue;
        const { error } = await db.from('services').update({ related_event_ids: merged, updated_at: now }).eq('id', sid);
        if (error) throw error;
        services_updated++;
      }
      return NextResponse.json({ pairs, servicesUpdated: services_updated, products: items.filter((i) => (i.serviceIds || []).length).length });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
