import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminDb, requireAdmin, GENERATOR_MODEL } from '@/lib/page-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CITY_WORDS = ['hyderabad', 'visakhapatnam', 'vizag', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'pune', 'delhi', 'kolkata', 'vijayawada', 'secunderabad'];
const cityWordsIn = (t: string) => CITY_WORDS.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(t));
const strip = (s: string) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

type Item = { kind: 'event' | 'service'; id: string; name: string; url: string; title: string; description: string; summary: string; category: string; price: number | null; titleChanged?: never };

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

const SYSTEM = `You rewrite page titles and meta descriptions for Retreat Arcade (event entertainment rentals: interactive games, photo booths, VR, team building). Each item gets a tighter title and description that keep the main search phrase.

Rules
- title: 40 to 60 characters, maximum 60. The main phrase (the product or service name with "rental" or similar) comes first. Add " | Retreat Arcade" only if the whole title still fits in 60 characters.
- description: 120 to 155 characters, maximum 155. One or two clear sentences with the main phrase and a reason to act. Use "starting from ₹N" only when a price is given, with that exact number.
- If the current title contains a city (for example Hyderabad), keep that same city in the new title. If it contains no city, do not add one. Never add any other city.
- Never invent facts, numbers, years or claims. No "best", "premier", "leading", "number one", "top", guarantees, or filler words.
- Keep it natural for a person reading search results.`;

const SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['id', 'title', 'description'], additionalProperties: false } } },
  required: ['items'],
  additionalProperties: false,
} as const;

const BANNED = /\b(best|premier|leading|number one|no\.? ?1|#1|top|guarantee[sd]?)\b/i;

function validate(it: Item, s: { title: string; description: string }) {
  const p: string[] = [];
  const t = s.title.trim(), d = s.description.trim();
  if (t.length < 25 || t.length > 62) p.push(`title ${t.length} chars`);
  if (d.length < 110 || d.length > 158) p.push(`description ${d.length} chars`);
  const before = cityWordsIn(it.title);
  const after = cityWordsIn(t + ' ' + d);
  if (after.some((c) => !before.includes(c) && !cityWordsIn(it.description).includes(c))) p.push('adds a city');
  if (before.length && !before.some((c) => cityWordsIn(t).includes(c))) p.push('lost the city name');
  if (BANNED.test(t + ' ' + d)) p.push('banned word');
  return p;
}

/**
 * POST { action }
 *  scan                              -> pages whose title or description needs work
 *  suggest { ids: string[] }         -> new title + description for up to 15 pages (nothing is saved)
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
      return NextResponse.json({ total: items.length, rows });
    }

    if (b.action === 'suggest') {
      if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 400 });
      const ids = new Set<string>((Array.isArray(b.ids) ? b.ids : []).slice(0, 15));
      const items = (await loadItems(db)).filter((i) => ids.has(i.id));
      if (!items.length) return NextResponse.json({ suggestions: [] });
      const client = new Anthropic();
      const done = new Map<string, { title: string; description: string }>();
      let todo = items;
      const notes = new Map<string, string>();
      for (let attempt = 0; attempt < 2 && todo.length; attempt++) {
        const payload = todo.map((i) => ({ id: i.id, type: i.kind === 'event' ? 'product page' : 'service page', name: i.name, category: i.category || null, starting_price_inr: i.price, summary: i.summary.slice(0, 280), current_title: i.title, current_description: i.description.slice(0, 300), keep_city_words: cityWordsIn(i.title), feedback: notes.get(i.id) || null }));
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
          const p = validate(it, s);
          if (p.length) { notes.set(it.id, `Rejected: ${p.join(', ')}. Fix it.`); next.push(it); done.set(it.id, { title: s.title.trim(), description: s.description.trim() }); /* keep best effort */ }
          else done.set(it.id, { title: s.title.trim(), description: s.description.trim() });
          if (!p.length) notes.delete(it.id);
        }
        todo = next.filter((it) => notes.has(it.id) || !done.has(it.id));
      }
      const suggestions = items.map((i) => {
        const s = done.get(i.id);
        return { id: i.id, kind: i.kind, title: s?.title || '', description: s?.description || '', problems: s ? validate(i, s) : ['no suggestion'] };
      });
      return NextResponse.json({ suggestions });
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
