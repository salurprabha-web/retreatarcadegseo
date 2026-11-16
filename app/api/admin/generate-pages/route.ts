import { NextResponse } from 'next/server';
import { adminDb, attachLeadPhrases, buildPlan, generateItem, loadCorpus, requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST { action: 'preview' | 'generate', cityId?, includeUpgrades?, limit? }
 *  preview  -> what WOULD be created (free, no AI call, nothing saved)
 *  generate -> writes up to `limit` drafts (default 6) and returns how many are left
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    const db = adminDb();
    const plan = await buildPlan(db, { cityId: body.cityId, includeUpgrades: !!body.includeUpgrades });

    if (body.action !== 'generate') {
      // products that are in no service never get city pages: tell the screen how many
      const [{ data: evs }, { data: svs }] = await Promise.all([
        db.from('events').select('id').eq('status', 'published'),
        db.from('services').select('related_event_ids, is_tech_service').eq('status', 'published'),
      ]);
      const att = new Set<string>();
      ((svs as any[]) || []).filter((s) => !s.is_tech_service).forEach((s) => (s.related_event_ids || []).forEach((i: string) => att.add(i)));
      const unattached = ((evs as any[]) || []).filter((e) => !att.has(e.id)).length;
      const count = (k: string, m: string) => plan.items.filter((i) => i.kind === k && i.mode === m).length;
      return NextResponse.json({
        total: plan.items.length,
        unattached,
        cityPages: plan.items.filter((i) => i.kind === 'city_page').length,
        newServicePages: count('service_city', 'new'),
        newProductPages: count('product_city', 'new'),
        upgrades: count('product_city', 'upgrade'),
        sample: plan.items.slice(0, 25).map((i) => `${i.mode === 'new' ? 'NEW' : 'UPGRADE'}: ${i.label}`),
      });
    }

    const limit = Math.min(Math.max(Number(body.limit) || 6, 1), 12);
    const skip = new Set<string>(Array.isArray(body.skip) ? body.skip : []);
    const todo = plan.items.filter((i) => !skip.has(i.label));
    const batch = todo.slice(0, limit);
    const corpus = await loadCorpus(db);
    const results = [];
    await attachLeadPhrases(db, batch);
    for (let i = 0; i < batch.length; i += 3) {
      results.push(...(await Promise.all(batch.slice(i, i + 3).map((it) => generateItem(db, it, corpus)))));
    }
    const done = results.filter((r) => r.ok).length;
    return NextResponse.json({ done, failed: results.filter((r) => !r.ok), remaining: Math.max(todo.length - batch.length, 0) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
