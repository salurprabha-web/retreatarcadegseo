/**
 * Automatic page generator (server only).
 *
 * Finds service/city/product combinations that have no page yet, asks Claude to write unique text
 * for each one, runs a quality gate, and saves the result as a DRAFT. Nothing becomes public until
 * an admin approves it.
 *
 * Status meanings (same words in both tables):
 *   draft      new page, hidden from the public until approved
 *   approved   text prepared for a page that is ALREADY live (a "text upgrade"); the page keeps its
 *              old text until the admin publishes the upgrade
 *   published  the generated text is in use
 *
 * Existing rows are never overwritten.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CITIES } from '@/lib/cities';

export const GENERATOR_MODEL = 'claude-sonnet-5-5';

export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Only a signed-in admin (valid Supabase session token) may use the generator. */
export async function requireAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const { data, error } = await adminDb().auth.getUser(token);
  return !error && !!data?.user;
}

/* ------------------------------------------------------------------ types */

export type PlanItem = {
  kind: 'service_city' | 'product_city' | 'city_page';
  /** new = brand-new hidden page, upgrade = text for a page that is already live */
  mode: 'new' | 'upgrade';
  service_id?: string;
  location_id: string;
  product_id?: string;
  label: string;
};

type Gen = { meta_title: string; meta_description: string; focus_keyword: string; intro: string; faqs: { q: string; a: string }[] };

/* -------------------------------------------------------------------- plan */

export async function buildPlan(db: SupabaseClient, opts: { cityId?: string; includeUpgrades?: boolean }) {
  const [{ data: locs }, { data: services }, { data: products }, { data: slSeo }, { data: plp }, { data: mappings }] =
    await Promise.all([
      db.from('locations').select('*'),
      db.from('services').select('id, title, slug, related_event_ids, is_tech_service, display_order').eq('status', 'published'),
      db.from('events').select('id, title').eq('status', 'published'),
      db.from('service_location_seo').select('service_id, location_id, status, intro'),
      db.from('product_location_pages').select('service_id, location_id, product_id').limit(10000),
      db.from('service_location_products').select('service_id, location_id, product_id').limit(5000),
    ]);

  const cities = (locs || []).filter((l: any) => (opts.cityId ? l.id === opts.cityId : l.is_active));
  const productTitle = new Map((products || []).map((p: any) => [p.id, p.title as string]));
  const seoKey = new Set((slSeo || []).map((r: any) => `${r.service_id}|${r.location_id}`));
  const plpKey = new Set((plp || []).map((r: any) => `${r.service_id}|${r.location_id}|${r.product_id}`));
  const liveKey = new Set((mappings || []).map((r: any) => `${r.service_id}|${r.location_id}|${r.product_id}`));

  // Index policy: one page per product per city. A product listed under several services is written
  // for its primary service only (lowest display_order), and not again if any service already has a page for it there.
  const primaryOf = new Map<string, string>();
  const orderOf = (s: any) => (s.display_order ?? 9999) * 1000 + String(s.title || '').length;
  for (const s of services || []) {
    if (s.is_tech_service) continue;
    for (const pid of (s.related_event_ids || []) as string[]) {
      const cur = primaryOf.get(pid);
      const curS = cur ? (services || []).find((x: any) => x.id === cur) : null;
      if (!curS || orderOf(s) < orderOf(curS)) primaryOf.set(pid, s.id);
    }
  }
  const hasPageFor = new Set((plp || []).map((r: any) => `${r.location_id}|${r.product_id}`));
  const items: PlanItem[] = [];
  const handWritten = new Set(CITIES.map((c) => c.slug));
  for (const city of cities) {
    if (!handWritten.has(city.slug) && (city.page_status ?? 'none') === 'none') {
      items.push({ kind: 'city_page', mode: 'new', location_id: city.id, label: `City page: ${city.city}` });
    }
  }
  for (const city of cities) {
    for (const s of services || []) {
      if (s.is_tech_service) continue;
      const ids: string[] = (s.related_event_ids || []).filter((id: string) => productTitle.has(id));
      if (!ids.length) continue;
      if (!seoKey.has(`${s.id}|${city.id}`)) {
        items.push({ kind: 'service_city', mode: 'new', service_id: s.id, location_id: city.id, label: `${s.title} in ${city.city}` });
      }
      for (const pid of ids) {
        const k = `${s.id}|${city.id}|${pid}`;
        if (plpKey.has(k)) continue;
        if (primaryOf.get(pid) !== s.id) continue; // another service is this product's primary page
        if (hasPageFor.has(`${city.id}|${pid}`)) continue; // this product already has a page in this city
        const live = liveKey.has(k);
        if (live && !opts.includeUpgrades) continue;
        items.push({
          kind: 'product_city',
          mode: live ? 'upgrade' : 'new',
          service_id: s.id,
          location_id: city.id,
          product_id: pid,
          label: `${productTitle.get(pid)} in ${city.city} (${s.title})`,
        });
      }
    }
  }
  return { cities, items };
}

/* ----------------------------------------------------------------- prompts */

const SYSTEM = `You write web page text for Retreat Arcade, an event entertainment rental company (interactive games, 360-degree photo booths, VR simulators, AI experiences, team-building activities for corporate events, weddings, college fests, brand activations and birthdays).

You are given facts about one page. Write text that is genuinely specific to that service/product in that city, so it could not be pasted onto another city's page.

Hard rules:
- Use ONLY the facts supplied. Never invent prices, years in business, number of events, awards, reviews, client names, addresses, phone numbers or statistics.
- Never say or imply where the equipment comes from or is delivered from. Never mention a warehouse, stock location, office or branch unless the facts say the city is the home city, and then only mention the base area given.
- Never mention any city other than the page's own city (and the nearby places supplied).
- Do not claim to be "the best", "number one" or "leading". Do not promise guarantees.
- Plain, concrete English. No filler such as "in today's fast-paced world", "elevate your event", "unforgettable", "look no further", "seamless".
- Mention 2 to 4 of the supplied local areas or venue types naturally, and the one occasion angle given. Do not list every area.
- Vary sentence openings. Do not start the intro with the product or city name.
- If "already_written_for_this_product_in_this_city" is not empty, the same product already has a page in this city under another service. Use clearly different wording, examples and structure, and lean on the service context.
- Keep the whole meta_title at or under 60 characters (shorten the product name if needed).

Output fields:
- meta_title: 45 to 62 characters. Must contain the product (or service) name and the city. Ends with " | Retreat Arcade" only if it still fits in 62 characters.
- meta_description: 120 to 155 characters, one or two sentences, a clear reason to click, includes the city.
- intro: two paragraphs separated by a blank line, 110 to 170 words total. First paragraph: what it is and who it suits in this city. Second: how it works at a local event, practical details a planner cares about (space, power, crowd size, timing) that you can state without inventing numbers, and a soft invitation to plan it in the 3D event planner or ask for a quote.
- focus_keyword: the main phrase a person in this city would type into Google to find this page, 2 to 5 words, lower case, for example "photo booth rental visakhapatnam". Use the nickname people search for if the facts give one. It must appear naturally in meta_title and in the intro.
- faqs: exactly 4 question/answer pairs a real planner in this city would ask. Answers 25 to 55 words. No invented figures.`;

const SCHEMA = {
  type: 'object',
  properties: {
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    focus_keyword: { type: 'string' },
    intro: { type: 'string' },
    faqs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { q: { type: 'string' }, a: { type: 'string' } },
        required: ['q', 'a'],
        additionalProperties: false,
      },
    },
  },
  required: ['meta_title', 'meta_description', 'focus_keyword', 'intro', 'faqs'],
  additionalProperties: false,
} as const;

const OCCASIONS = [
  'corporate annual day or team outing',
  'wedding, sangeet or reception',
  'college fest',
  'brand activation, exhibition or mall event',
  'birthday or family celebration',
  'product launch or conference',
  'apartment community or festival event',
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number, n: number): T[] {
  if (!arr.length) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(n, arr.length); i++) out.push(arr[(seed + i * 3) % arr.length]);
  return Array.from(new Set(out));
}

/* ------------------------------------------------------------ quality gate */

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

function shingles(s: string, n = 4) {
  const w = words(s);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

function similarity(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return inter / (a.size + b.size - inter);
}

/** "Interactive Games Rental in Hyderabad" must not push the writer to mention Hyderabad on another city's page */
function stripOtherCities(text: string | null | undefined, others: string[]): string {
  let t = String(text || '');
  for (const c of others) {
    if (!c) continue;
    const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s*\\b(?:in|for|at|across|around)?\\s*${esc}\\b`, 'gi'), ' ');
  }
  return t.replace(/\s{2,}/g, ' ').replace(/\s+([,.–-])/g, '$1').trim();
}

export type Corpus = { titles: Set<string>; intros: Set<string>[] };

export function checkQuality(g: Gen, ctx: { cityName: string; cityAlias?: string | null; otherCities: string[]; subject: string }, corpus: Corpus): string[] {
  const problems: string[] = [];
  if (g.meta_title.length < 25 || g.meta_title.length > 66) problems.push(`meta_title length ${g.meta_title.length} (need 45-62)`);
  const tl = g.meta_title.toLowerCase();
  if (!tl.includes(ctx.cityName.toLowerCase()) && !(ctx.cityAlias && tl.includes(ctx.cityAlias.toLowerCase()))) problems.push('meta_title must contain the city');
  if (g.meta_description.length < 100 || g.meta_description.length > 165) problems.push(`meta_description length ${g.meta_description.length} (need 120-155)`);
  const wc = words(g.intro).length;
  if (wc < 90 || wc > 220) problems.push(`intro has ${wc} words (need 110-170)`);
  if (g.faqs.length !== 4) problems.push('need exactly 4 faqs');
  if (!g.focus_keyword || g.focus_keyword.length < 5) problems.push('focus_keyword missing');
  const all = [g.meta_title, g.meta_description, g.intro, ...g.faqs.map((f) => f.q + ' ' + f.a)].join(' ');
  for (const c of ctx.otherCities) {
    if (c && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(all)) problems.push(`mentions another city: ${c}`);
  }
  if (/(deliver(ed|ing)?|shipped|dispatched|brought|transported)\s+(in\s+)?from\s+(our\s+|the\s+|a\s+)?(warehouse|stock|office|branch|base|hub|another city|elsewhere)|our (warehouse|stock|office|branch|studio)|stock(ed)? in/i.test(all)) problems.push('mentions where equipment comes from');
  if (/\b(best|number one|no\.? ?1|#1|leading|guarantee[sd]?)\b/i.test(all)) problems.push('uses a banned superlative or guarantee');
  if (/\b\d{2,}\+?\s*(events|clients|years|customers)\b/i.test(all)) problems.push('contains an invented statistic');
  if (corpus.titles.has(g.meta_title.trim().toLowerCase())) problems.push('meta_title duplicates an existing title');
  const sh = shingles(g.intro);
  for (const other of corpus.intros) {
    if (similarity(sh, other) > 0.3) {
      problems.push('intro is too similar to another page');
      break;
    }
  }
  return problems;
}

/* ---------------------------------------------------------------- generate */

let _client: Anthropic | null = null;
function claude() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  return (_client ||= new Anthropic());
}

async function callClaude(facts: object, feedback?: string): Promise<Gen> {
  const content = `Page facts (JSON):\n${JSON.stringify(facts, null, 2)}${
    feedback ? `\n\nYour previous attempt was rejected for these reasons. Fix them:\n- ${feedback}` : ''
  }`;
  const res = await claude().messages.create({
    model: GENERATOR_MODEL,
    max_tokens: 4000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
    messages: [{ role: 'user', content }],
  } as any);
  const block: any = (res as any).content.find((b: any) => b.type === 'text');
  if (!block) throw new Error('Claude returned no text');
  const g = JSON.parse(block.text) as Gen;
  g.meta_title = g.meta_title.trim();
  g.meta_description = g.meta_description.trim();
  g.focus_keyword = String(g.focus_keyword || '').trim().toLowerCase();
  g.intro = g.intro.trim();
  return g;
}

export async function loadCorpus(db: SupabaseClient): Promise<Corpus> {
  const [{ data: a }, { data: b }] = await Promise.all([
    db.from('service_location_seo').select('meta_title, intro').limit(3000),
    db.from('product_location_pages').select('meta_title, intro').limit(5000),
  ]);
  const titles = new Set<string>();
  const intros: Set<string>[] = [];
  for (const r of [...(a || []), ...(b || [])] as any[]) {
    if (r.meta_title) titles.add(String(r.meta_title).trim().toLowerCase());
    if (r.intro) intros.push(shingles(r.intro));
  }
  return { titles, intros };
}

export type GenResult = { label: string; ok: boolean; error?: string };

/** Generates and saves ONE planned page. Never overwrites an existing row. */
export async function generateItem(db: SupabaseClient, item: PlanItem, corpus: Corpus): Promise<GenResult> {
  if (item.kind === 'city_page') return generateCityPage(db, item, corpus);
  try {
    const [{ data: city }, { data: service }, { data: allCities }] = await Promise.all([
      db.from('locations').select('*').eq('id', item.location_id).single(),
      db.from('services').select('id, title, summary, description').eq('id', item.service_id!).single(),
      db.from('locations').select('city, alias'),
    ]);
    if (!city || !service) throw new Error('city or service not found');
    let product: any = null;
    if (item.product_id) {
      const r = await db.from('events').select('id, title, summary, category, highlights').eq('id', item.product_id).single();
      product = r.data;
      if (!product) throw new Error('product not found');
    }

    // never create a second row for the same page
    if (item.kind === 'service_city') {
      const { data: ex } = await db.from('service_location_seo').select('id').eq('service_id', item.service_id!).eq('location_id', item.location_id).maybeSingle();
      if (ex) return { label: item.label, ok: false, error: 'already exists, skipped' };
    } else {
      const { data: ex } = await db.from('product_location_pages').select('id').eq('service_id', item.service_id).eq('location_id', item.location_id).eq('product_id', item.product_id!).maybeSingle();
      if (ex) return { label: item.label, ok: false, error: 'already exists, skipped' };
    }

    const otherNames: string[] = (allCities || []).flatMap((c: any) => [c.city, c.alias]).filter((n: string) => n && n !== city.city && n !== city.alias);
    // the same product can sit in several services: show the writer what is already there so it takes a different angle
    let sameProductIntros: string[] = [];
    if (item.kind === 'product_city') {
      const { data: sib } = await db.from('product_location_pages').select('intro').eq('location_id', item.location_id).eq('product_id', item.product_id!).limit(3);
      sameProductIntros = (sib || []).map((r: any) => String(r.intro || '').slice(0, 260)).filter(Boolean);
    }
    const seed = hash(`${item.service_id}${item.location_id}${item.product_id || ''}`);
    const areas: string[] = Array.isArray(city.areas) ? city.areas : [];
    const venues: string[] = Array.isArray(city.venues) ? city.venues : [];
    const facts = {
      page_type: item.kind === 'product_city' ? 'product page inside a service, in one city' : 'service page for one city',
      city: {
        name: city.city,
        also_known_as: city.alias || null,
        state: city.state || null,
        is_home_city: !!city.is_home,
        home_base_area: city.is_home ? 'Madhapur' : null,
        local_areas_to_choose_from: pick(areas, seed, 4),
        typical_venues: pick(venues, seed >> 3, 3),
        nearby_places: Array.isArray(city.nearby) ? city.nearby : [],
        notes: city.local_notes || null,
      },
      service: { name: stripOtherCities(service.title, otherNames), summary: stripOtherCities(service.summary, otherNames) || null },
      product: product
        ? { name: stripOtherCities(product.title, otherNames), summary: stripOtherCities(product.summary, otherNames) || null, category: product.category || null, highlights: Array.isArray(product.highlights) ? product.highlights.slice(0, 6).map((h: string) => stripOtherCities(h, otherNames)) : [] }
        : null,
      already_written_for_this_product_in_this_city: sameProductIntros,
      occasion_angle: OCCASIONS[seed % OCCASIONS.length],
    };

    const ctx = {
      cityName: city.city,
      cityAlias: city.alias || null,
      otherCities: (allCities || []).flatMap((c: any) => [c.city, c.alias]).filter((n: string) => n && n !== city.city && n !== city.alias),
      subject: product?.title || service.title,
    };

    let gen: Gen | null = null;
    let feedback: string | undefined;
    let best: { g: Gen; problems: string[] } | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const g = await callClaude(facts, feedback);
      const problems = checkQuality(g, ctx, corpus);
      if (!problems.length) {
        gen = g;
        break;
      }
      if (!best || problems.length < best.problems.length) best = { g, problems };
      feedback = problems.join('\n- ');
    }
    let reviewNote = '';
    if (!gen) {
      // safety problems are never saved; length / similarity problems are saved for a human to fix
      const hard = (best?.problems || []).some((p) => /another city|where equipment|banned|invented/.test(p));
      if (!best || hard) return { label: item.label, ok: false, error: `quality check failed: ${feedback}` };
      gen = best.g;
      reviewNote = ` | needs review: ${best.problems.join('; ')}`;
    }

    const now = new Date().toISOString();
    if (item.kind === 'service_city') {
      const { error } = await insertWithKeyword(db, 'service_location_seo', {
        service_id: item.service_id,
        location_id: item.location_id,
        meta_title: gen.meta_title,
        meta_description: gen.meta_description,
        intro: gen.intro,
        faqs: gen.faqs,
        focus_keyword: gen.focus_keyword,
        status: 'draft',
        generated_by: GENERATOR_MODEL + reviewNote,
        generated_at: now,
        updated_at: now,
      });
      if (error) throw error;
    } else {
      const { error } = await insertWithKeyword(db, 'product_location_pages', {
        service_id: item.service_id,
        location_id: item.location_id,
        product_id: item.product_id,
        meta_title: gen.meta_title,
        meta_description: gen.meta_description,
        intro: gen.intro,
        faqs: gen.faqs,
        focus_keyword: gen.focus_keyword,
        status: item.mode === 'new' ? 'draft' : 'approved',
        generated_by: GENERATOR_MODEL + reviewNote,
        generated_at: now,
      });
      if (error) throw error;
      // make the product appear under this service in this city (the old manual mapping step)
      const { data: m } = await db.from('service_location_products').select('id').eq('service_id', item.service_id).eq('location_id', item.location_id).eq('product_id', item.product_id!).maybeSingle();
      if (!m) {
        await db.from('service_location_products').insert({ service_id: item.service_id, location_id: item.location_id, product_id: item.product_id, is_enabled: true });
      }
    }
    corpus.titles.add(gen.meta_title.toLowerCase());
    corpus.intros.push(shingles(gen.intro));
    return { label: item.label, ok: true };
  } catch (e: any) {
    return { label: item.label, ok: false, error: e?.message || String(e) };
  }
}

/* ------------------------------------------------------------ city pages */

const CITY_SYSTEM = `You write the landing page text for one city for Retreat Arcade, an event entertainment rental company (interactive games, 360-degree photo booths, VR simulators, AI experiences and team-building activities for corporate events, weddings, college fests, brand activations and birthdays).

Use ONLY the supplied facts about the city. Never invent prices, years in business, number of events, awards, reviews, addresses, phone numbers or statistics. Never say or imply where equipment comes from or is delivered from, and never mention an office, warehouse or branch unless the facts say the city is the home city. Never mention any other city except the nearby places supplied. No "best", "number one", "leading" or guarantees. No filler such as "elevate your event", "unforgettable", "seamless". Plain, concrete English.

Output fields:
- meta_title: 45 to 62 characters, contains the city name, about event game / photo booth / VR rentals.
- meta_description: 120 to 155 characters, contains the city name.
- focus_keyword: the main phrase someone in this city would type into Google to find event game and photo booth rentals, 2 to 5 words, lower case, for example "event rentals vizag". It must appear naturally in meta_title and in the first intro paragraph.
- hero_line: one sentence, 8 to 16 words.
- intro: array of exactly 3 paragraphs (40 to 70 words each): who we serve in this city and what we offer; how local venues, areas and seasons shape event planning (use 3 to 5 supplied areas); an invitation to use the 3D event planner or ask for a quote.
- occasions: exactly 5 items {title, text}; text 15 to 30 words each, each tied to this city's supplied venues or areas.
- faqs: exactly 5 {q, a}; answers 25 to 55 words; no invented figures.`;

const CITY_SCHEMA = {
  type: 'object',
  properties: {
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    hero_line: { type: 'string' },
    focus_keyword: { type: 'string' },
    intro: { type: 'array', items: { type: 'string' } },
    occasions: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, text: { type: 'string' } }, required: ['title', 'text'], additionalProperties: false } },
    faqs: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'], additionalProperties: false } },
  },
  required: ['meta_title', 'meta_description', 'hero_line', 'focus_keyword', 'intro', 'occasions', 'faqs'],
  additionalProperties: false,
} as const;

type CityGen = { meta_title: string; meta_description: string; hero_line: string; focus_keyword?: string; intro: string[]; occasions: { title: string; text: string }[]; faqs: { q: string; a: string }[] };

export function checkCityQuality(g: CityGen, ctx: { cityName: string; cityAlias?: string | null; otherCities: string[] }, corpus: Corpus): string[] {
  const p: string[] = [];
  const tl = g.meta_title.toLowerCase();
  if (g.meta_title.length < 25 || g.meta_title.length > 66) p.push(`meta_title length ${g.meta_title.length} (need 45-62)`);
  if (!tl.includes(ctx.cityName.toLowerCase()) && !(ctx.cityAlias && tl.includes(ctx.cityAlias.toLowerCase()))) p.push('meta_title must contain the city');
  if (g.meta_description.length < 100 || g.meta_description.length > 165) p.push(`meta_description length ${g.meta_description.length} (need 120-155)`);
  if (g.intro.length !== 3) p.push('intro needs exactly 3 paragraphs');
  if (g.occasions.length !== 5) p.push('need exactly 5 occasions');
  if (g.faqs.length !== 5) p.push('need exactly 5 faqs');
  const wc = words(g.intro.join(' ')).length;
  if (wc < 100 || wc > 260) p.push(`intro has ${wc} words (need about 120-210)`);
  const all = [g.meta_title, g.meta_description, g.hero_line, ...g.intro, ...g.occasions.map((o) => o.title + ' ' + o.text), ...g.faqs.map((f) => f.q + ' ' + f.a)].join(' ');
  for (const c of ctx.otherCities) {
    if (c && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(all)) p.push(`mentions another city: ${c}`);
  }
  if (/(deliver(ed|ing)?|shipped|dispatched|brought|transported)\s+(in\s+)?from\s+(our\s+|the\s+|a\s+)?(warehouse|stock|office|branch|base|hub|another city|elsewhere)|our (warehouse|stock|office|branch|studio)|stock(ed)? in/i.test(all)) p.push('mentions where equipment comes from');
  if (/\b(best|number one|no\.? ?1|#1|leading|guarantee[sd]?)\b/i.test(all)) p.push('uses a banned superlative or guarantee');
  if (corpus.titles.has(g.meta_title.trim().toLowerCase())) p.push('meta_title duplicates an existing title');
  const sh = shingles(g.intro.join(' '));
  for (const o of corpus.intros) if (similarity(sh, o) > 0.3) { p.push('intro is too similar to another page'); break; }
  return p;
}

async function generateCityPage(db: SupabaseClient, item: PlanItem, corpus: Corpus): Promise<GenResult> {
  try {
    const [{ data: city }, { data: allCities }] = await Promise.all([
      db.from('locations').select('*').eq('id', item.location_id).single(),
      db.from('locations').select('city, alias'),
    ]);
    if (!city) throw new Error('city not found');
    if ((city.page_status ?? 'none') !== 'none') return { label: item.label, ok: false, error: 'already has a city page, skipped' };
    const facts = {
      city: {
        name: city.city,
        also_known_as: city.alias || null,
        state: city.state || null,
        is_home_city: !!city.is_home,
        home_base_area: city.is_home ? 'Madhapur' : null,
        local_areas: Array.isArray(city.areas) ? city.areas : [],
        typical_venues: Array.isArray(city.venues) ? city.venues : [],
        nearby_places: Array.isArray(city.nearby) ? city.nearby : [],
        notes: city.local_notes || null,
      },
    };
    const ctx = {
      cityName: city.city,
      cityAlias: city.alias || null,
      otherCities: (allCities || []).flatMap((c: any) => [c.city, c.alias]).filter((n: string) => n && n !== city.city && n !== city.alias),
    };
    let gen: CityGen | null = null;
    let feedback: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const content = `City facts (JSON):\n${JSON.stringify(facts, null, 2)}${feedback ? `\n\nYour previous attempt was rejected for these reasons. Fix them:\n- ${feedback}` : ''}`;
      const res = await claude().messages.create({
        model: GENERATOR_MODEL,
        max_tokens: 5000,
        system: [{ type: 'text', text: CITY_SYSTEM, cache_control: { type: 'ephemeral' } }],
        output_config: { effort: 'low', format: { type: 'json_schema', schema: CITY_SCHEMA as any } } as any,
        messages: [{ role: 'user', content }],
      } as any);
      const block: any = (res as any).content.find((b: any) => b.type === 'text');
      if (!block) throw new Error('Claude returned no text');
      const g = JSON.parse(block.text) as CityGen;
      const problems = checkCityQuality(g, ctx, corpus);
      if (!problems.length) { gen = g; break; }
      feedback = problems.join('\n- ');
    }
    if (!gen) return { label: item.label, ok: false, error: `quality check failed: ${feedback}` };
    const { error } = await db.from('locations').update({ page_status: 'draft', page_content: { ...gen, generated_by: GENERATOR_MODEL, generated_at: new Date().toISOString() } }).eq('id', item.location_id);
    if (error) throw error;
    corpus.titles.add(gen.meta_title.toLowerCase());
    corpus.intros.push(shingles(gen.intro.join(' ')));
    return { label: item.label, ok: true };
  } catch (e: any) {
    return { label: item.label, ok: false, error: e?.message || String(e) };
  }
}

/** Saves a generated row; if the database does not have the focus_keyword column yet, saves it without. */
async function insertWithKeyword(db: SupabaseClient, table: string, row: Record<string, any>) {
  const first = await db.from(table).insert(row);
  if (first.error && /focus_keyword/i.test(first.error.message || '')) {
    const { focus_keyword, ...rest } = row;
    return db.from(table).insert(rest);
  }
  return first;
}
