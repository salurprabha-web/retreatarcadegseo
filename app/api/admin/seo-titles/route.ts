import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminDb, requireAdmin, GENERATOR_MODEL } from '@/lib/page-generator';
import { dataForSeoConfigured, fetchSearchVolumes, fetchTopTitles, type SerpTitle } from '@/lib/dataforseo';
import { makeCandidates } from '@/lib/smart-keywords';
import { keyOf } from '@/lib/keywords';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CITY_WORDS = ['hyderabad', 'visakhapatnam', 'vizag', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'pune', 'delhi', 'kolkata', 'vijayawada', 'secunderabad'];
const cityWordsIn = (t: string) => CITY_WORDS.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(t));
const strip = (s: string) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const toks = (s: string) => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !['the', 'and', 'for', 'in', 'of', 'a', 'to', 'retreat', 'arcade'].includes(w)));
const jacc = (a: Set<string>, b: Set<string>) => { let n = 0; a.forEach((x) => b.has(x) && n++); return a.size + b.size - n ? n / (a.size + b.size - n) : 0; };

type Item = { kind: 'event' | 'service'; id: string; name: string; url: string; title: string; description: string; summary: string; category: string; price: number | null };

/** Titles that page code builds when the CMS field is empty (kept identical to the pages). */
async function loadItems(db: any): Promise<Item[]> {
  const [{ data: ev }, { data: sv }] = await Promise.all([
    db.from('events').select('id, title, slug, category, summary, price, meta_title, meta_description').eq('status', 'published'),
    db.from('services').select('id, title, slug, summary, meta_title, meta_description, is_tech_service').eq('status', 'published'),
  ]);
  const items: Item[] = [];
  for (const e of ev || []) items.push({ kind: 'event', id: e.id, name: String(e.title).trim(), url: `/events/${e.slug}`, title: e.meta_title || e.title, description: e.meta_description || e.summary || '', summary: strip(e.summary), category: e.category || '', price: e.price ? Number(e.price) : null });
  for (const s of sv || []) items.push({ kind: 'service', id: s.id, name: String(s.title).trim(), url: `/services/${s.slug}`, title: s.meta_title || `${s.title} | Event Entertainment Across India | Retreat Arcade`, description: s.meta_description || strip(s.summary), summary: strip(s.summary), category: '', price: null });
  return items;
}

const problemsOf = (title: string, description: string) => {
  const p: string[] = [];
  if (title.length > 62) p.push(`Title is ${title.length} characters (Google shows about 60)`);
  if (description.length > 158) p.push(`Description is ${description.length} characters (Google shows about 155)`);
  if (description.length < 90) p.push(description ? `Description is short (${description.length} characters)` : 'No description');
  return p;
};

/* ------------------------------------------------------------- lead phrase */

type Lead = { phrase: string; volume: number | null; known: boolean };

/** The phrase this page should lead with: the most-searched of the phrases people really type for it. */
async function leadPhrases(db: any, items: Item[]): Promise<Map<string, Lead>> {
  const out = new Map<string, Lead>();
  const cand = new Map<string, string[]>();
  for (const it of items) {
    const cities = cityWordsIn(it.title);
    cand.set(it.id, makeCandidates(it.name, cities.length ? [cities[0]] : ['']).slice(0, 12));
  }
  const all = Array.from(new Set(Array.from(cand.values()).flat()));
  const probe = await db.from('seo_keywords').select('id').limit(1);
  const vol = new Map<string, number | null>();
  if (!probe.error) {
    const read = async () => {
      for (let i = 0; i < all.length; i += 150) {
        const { data } = await db.from('seo_keywords').select('keyword_key, volume').in('keyword_key', all.slice(i, i + 150).map(keyOf));
        (data || []).forEach((r: any) => vol.set(r.keyword_key, r.volume));
      }
    };
    await read();
    const fresh = all.filter((p) => !vol.has(keyOf(p)));
    for (let i = 0; i < fresh.length; i += 200) await db.from('seo_keywords').insert(fresh.slice(i, i + 200).map((p) => ({ keyword: p, source: 'auto', status: 'idea', owner_type: 'none', intent: 'buy' })));
    if (dataForSeoConfigured()) {
      await read();
      const need = all.filter((p) => vol.get(keyOf(p)) == null).slice(0, 600);
      if (need.length) {
        try {
          const vols = await fetchSearchVolumes(need);
          const byKey = new Map(vols.map((v) => [keyOf(v.keyword), v]));
          const now = new Date().toISOString();
          for (const p of need) {
            const v = byKey.get(keyOf(p));
            await db.from('seo_keywords').update({ volume: v?.volume ?? 0, competition: v?.competition ?? null, cpc: v?.cpc ?? null, source: 'dataforseo', fetched_at: now, updated_at: now }).eq('keyword_key', keyOf(p));
            vol.set(keyOf(p), v?.volume ?? 0);
          }
        } catch { /* volumes are a bonus: carry on without */ }
      }
    }
  }
  for (const it of items) {
    const c = cand.get(it.id) || [];
    const ranked = c.map((p) => ({ p, v: vol.get(keyOf(p)) ?? null })).sort((a, b) => (b.v ?? -1) - (a.v ?? -1) || a.p.length - b.p.length);
    const best = ranked[0];
    out.set(it.id, best ? { phrase: best.p, volume: best.v, known: (best.v ?? 0) > 0 } : { phrase: it.name.toLowerCase(), volume: null, known: false });
  }
  return out;
}

/* ---------------------------------------------------------------- the writer */

const SYSTEM = `You rewrite page titles and meta descriptions for Retreat Arcade (event entertainment rentals: interactive games, photo booths, VR, team building) so they rank AND get clicked in Google.

For each page you get a lead_phrase: the most-searched phrase people type for it. Build the title around it.

Title rules
- 40 to 60 characters, maximum 60. Start with the lead_phrase (or its close natural form). Add " | Retreat Arcade" only if the title still fits in 60 characters.
- Make it clickable: add ONE concrete reason to choose it, such as "starting from ₹N" (only when a price is given, with that exact number), "trained operator", "instant prints", "setup included", but only things the page facts support.
- If the current title contains a city (for example Hyderabad), keep that same city. If it contains no city, do not add one. Never add any other city.
- Do not copy the competitor titles; use them only to see what is common and write something that stands out.

Description rules
- 120 to 155 characters, maximum 155. Include the lead_phrase naturally, one concrete benefit, and a soft call to action ("Get a quote", "Book today").

General
- Never invent facts, numbers, years or claims. No "best", "premier", "leading", "top", "number one", guarantees, or filler.
- Each title must be clearly different from the other titles in the list.`;

const SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['id', 'title', 'description'], additionalProperties: false } } },
  required: ['items'],
  additionalProperties: false,
} as const;

const BANNED = /\b(best|premier|leading|number one|no\.? ?1|#1|top|guarantee[sd]?)\b/i;

function validate(it: Item, s: { title: string; description: string }, lead: Lead, others: { id: string; title: string }[]) {
  const p: string[] = [];
  const t = s.title.trim(), d = s.description.trim();
  if (t.length < 25 || t.length > 62) p.push(`title ${t.length} chars`);
  if (d.length < 110 || d.length > 158) p.push(`description ${d.length} chars`);
  const before = cityWordsIn(it.title);
  if (cityWordsIn(t + ' ' + d).some((c) => !before.includes(c) && !cityWordsIn(it.description).includes(c))) p.push('adds a city');
  if (before.length && !before.some((c) => cityWordsIn(t).includes(c))) p.push('lost the city name');
  if (BANNED.test(t + ' ' + d)) p.push('banned word');
  const lt = Array.from(toks(lead.phrase)).filter((w) => !CITY_WORDS.includes(w) && !['rental', 'hire', 'rent', 'on'].includes(w));
  if (lt.length && !lt.every((w) => t.toLowerCase().includes(w))) p.push('lead phrase missing from the title');
  const mine = toks(t);
  const clash = others.find((o) => o.id !== it.id && jacc(mine, toks(o.title)) >= 0.8);
  if (clash) p.push(`too similar to "${clash.title.slice(0, 50)}"`);
  return p;
}

/**
 * POST { action }
 *  scan                                        -> pages whose title or description needs work
 *  suggest { ids, serp?: boolean }             -> new title + description for up to 12 pages (nothing is saved)
 *  apply   { changes: [{kind,id,title,description}] }  -> saves the ones you approved
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();

    if (b.action === 'scan') {
      const items = await loadItems(db);
      const rows = items.map((i) => ({ kind: i.kind, id: i.id, name: i.name, url: i.url, title: i.title, description: i.description, problems: problemsOf(i.title, i.description) })).filter((r) => r.problems.length);
      return NextResponse.json({ total: items.length, rows, dataForSeo: dataForSeoConfigured() });
    }

    if (b.action === 'suggest') {
      if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 400 });
      const everything = await loadItems(db);
      const ids = new Set<string>((Array.isArray(b.ids) ? b.ids : []).slice(0, 12));
      const items = everything.filter((i) => ids.has(i.id));
      if (!items.length) return NextResponse.json({ suggestions: [] });

      const leads = await leadPhrases(db, items);
      const serp = new Map<string, SerpTitle[]>();
      let serpNote = '';
      if (b.serp && dataForSeoConfigured()) {
        const res = await Promise.all(items.map(async (i) => { try { return [i.id, await fetchTopTitles(leads.get(i.id)!.phrase)] as const; } catch (e: any) { serpNote = String(e.message || e); return [i.id, [] as SerpTitle[]] as const; } }));
        res.forEach(([id, t]) => serp.set(id, t));
      }
      const others = everything.map((i) => ({ id: i.id, title: i.title }));

      const client = new Anthropic();
      const done = new Map<string, { title: string; description: string }>();
      const notes = new Map<string, string>();
      let todo = items;
      for (let attempt = 0; attempt < 2 && todo.length; attempt++) {
        const payload = todo.map((i) => ({
          id: i.id, type: i.kind === 'event' ? 'product page' : 'service page', name: i.name, category: i.category || null, starting_price_inr: i.price,
          summary: i.summary.slice(0, 260), current_title: i.title, current_description: i.description.slice(0, 260), keep_city_words: cityWordsIn(i.title),
          lead_phrase: leads.get(i.id)!.phrase, searches_per_month: leads.get(i.id)!.volume,
          competitor_titles_on_google: (serp.get(i.id) || []).map((t) => t.title), feedback: notes.get(i.id) || null,
        }));
        const res = await client.messages.create({
          model: GENERATOR_MODEL,
          max_tokens: 4000,
          system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
          output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
          messages: [{ role: 'user', content: `Pages (JSON). Return one entry per id.\n${JSON.stringify(payload, null, 1)}` }],
        } as any);
        const block: any = (res as any).content.find((x: any) => x.type === 'text');
        const out = JSON.parse(block.text).items as { id: string; title: string; description: string }[];
        const next: Item[] = [];
        for (const it of todo) {
          const s = out.find((o) => o.id === it.id);
          if (!s) { next.push(it); continue; }
          done.set(it.id, { title: s.title.trim(), description: s.description.trim() });
          // later titles in this batch must differ from the ones just written
          const p = validate(it, s, leads.get(it.id)!, [...others.filter((o) => !ids.has(o.id)), ...Array.from(done.entries()).filter(([k]) => k !== it.id).map(([k, v]) => ({ id: k, title: v.title }))]);
          if (p.length) { notes.set(it.id, `Rejected: ${p.join(', ')}. Fix it.`); next.push(it); } else notes.delete(it.id);
        }
        todo = next;
      }
      const final = Array.from(done.entries()).map(([k, v]) => ({ id: k, title: v.title }));
      const suggestions = items.map((i) => {
        const s = done.get(i.id);
        const lead = leads.get(i.id)!;
        return { id: i.id, kind: i.kind, title: s?.title || '', description: s?.description || '', lead: lead.phrase, volume: lead.volume, competitors: (serp.get(i.id) || []).map((t) => t.title), problems: s ? validate(i, s, lead, [...others.filter((o) => !ids.has(o.id)), ...final.filter((f) => f.id !== i.id)]) : ['no suggestion'] };
      });
      return NextResponse.json({ suggestions, serpNote });
    }

    if (b.action === 'apply') {
      const changes: any[] = Array.isArray(b.changes) ? b.changes : [];
      let updated = 0;
      const now = new Date().toISOString();
      for (const c of changes) {
        const title = String(c.title || '').trim(), description = String(c.description || '').trim();
        if (!title || !description || title.length > 80 || description.length > 200) continue;
        const table = c.kind === 'service' ? 'services' : c.kind === 'event' ? 'events' : '';
        if (!table) continue;
        const { error } = await db.from(table).update({ meta_title: title, meta_description: description, updated_at: now }).eq('id', c.id);
        if (!error) updated++;
      }
      return NextResponse.json({ updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
