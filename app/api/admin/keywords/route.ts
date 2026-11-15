import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { addCandidateIdeas, fillVolumes, keyOf, readRunLog, syncOwners } from '@/lib/keywords';
import { dataForSeoConfigured } from '@/lib/dataforseo';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MISSING = 'Run AUTO_PAGES_STEP5.sql in Supabase first (it creates the keyword list).';

/**
 * POST { action, ... }
 *  list        { city?, owner?: 'all'|'owned'|'free', q?, page? }
 *  sync        register every published page/post's main keyword (never overwrites another owner)
 *  candidates  add ideas for every live city (free, no AI)
 *  import      { text }  lines like "keyword,volume" (Google Keyword Planner export works)
 *  volumes     { limit? } look up search volumes with DataForSEO for phrases that have none
 *  update      { id, fields }   edit volume/owner/status/notes
 *  delete      { id }
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();
    const probe = await db.from('seo_keywords').select('id').limit(1);
    if (probe.error) return NextResponse.json({ error: MISSING, needsSql: true }, { status: 400 });

    if (b.action === 'list') {
      const per = 100;
      const from = Math.max(0, Number(b.page || 0)) * per;
      let q = db.from('seo_keywords').select('*', { count: 'exact' }).order('volume', { ascending: false, nullsFirst: false }).order('keyword').range(from, from + per - 1);
      if (b.city) q = q.eq('city_slug', b.city);
      if (b.owner === 'owned') q = q.neq('owner_type', 'none');
      if (b.owner === 'free') q = q.eq('owner_type', 'none');
      if (b.q) q = q.ilike('keyword', `%${String(b.q).replace(/[%_]/g, '')}%`);
      const { data, count, error } = await q;
      if (error) throw error;
      const { count: noVol } = await db.from('seo_keywords').select('id', { count: 'exact', head: true }).is('volume', null);
      return NextResponse.json({ rows: data, total: count || 0, perPage: per, withoutVolume: noVol || 0, dataForSeo: dataForSeoConfigured(), cron: !!process.env.CRON_SECRET, lastRun: await readRunLog(db) });
    }

    if (b.action === 'sync') return NextResponse.json(await syncOwners(db));

    if (b.action === 'candidates') return NextResponse.json({ added: await addCandidateIdeas(db) });

    if (b.action === 'import') {
      const lines = String(b.text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let added = 0, updated = 0;
      for (const line of lines) {
        const cols = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());
        const kw = cols[0];
        if (!kw || /^(keyword|search term)/i.test(kw)) continue;
        const nums = cols.slice(1).map((c) => Number(c.replace(/[^0-9.]/g, ''))).filter((n) => !Number.isNaN(n) && n >= 0);
        const volume = nums.length ? Math.round(nums[0]) : null;
        const { data: ex } = await db.from('seo_keywords').select('id').eq('keyword_key', keyOf(kw)).maybeSingle();
        if (ex) { await db.from('seo_keywords').update({ volume, source: 'import', fetched_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', (ex as any).id); updated++; }
        else { await db.from('seo_keywords').insert({ keyword: kw, volume, source: 'import', status: 'idea', fetched_at: new Date().toISOString() }); added++; }
      }
      return NextResponse.json({ added, updated });
    }

    if (b.action === 'volumes') {
      if (!dataForSeoConfigured()) return NextResponse.json({ error: 'DataForSEO is not connected yet. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel (see the instructions on this page), then redeploy.', notConfigured: true }, { status: 400 });
      const r = await fillVolumes(db, Number(b.limit) || 300);
      return NextResponse.json(r.asked ? r : { updated: 0, note: 'Every phrase already has a volume.' });
    }

    if (b.action === 'update') {
      const allowed: Record<string, any> = { updated_at: new Date().toISOString() };
      for (const k of ['volume', 'status', 'notes', 'intent', 'city_slug']) if (b.fields && k in b.fields) allowed[k] = b.fields[k] === '' ? null : b.fields[k];
      if (b.fields?.owner_url !== undefined) { allowed.owner_url = b.fields.owner_url || null; allowed.owner_type = b.fields.owner_url ? 'manual' : 'none'; }
      const { error } = await db.from('seo_keywords').update(allowed).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (b.action === 'delete') {
      const { error } = await db.from('seo_keywords').delete().eq('id', b.id).eq('owner_type', 'none');
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
