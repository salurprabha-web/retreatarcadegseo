/**
 * AI product writer (server only).
 * You give: name, your facts, price, Cloudinary pictures. The AI writes the whole product page as a DRAFT
 * (nothing is public), looks at your pictures, builds the SEO around the most-searched phrase, and asks you for
 * any real fact it needs and does not have. It never invents sizes, power needs, prices, capacities or clients.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GENERATOR_MODEL } from '@/lib/page-generator';
import { leadPhrasesFor } from '@/lib/lead-phrase';
import { sanitizeHtml } from '@/lib/blog-writer';
import { choosePrimary, tokens } from '@/lib/primary-pick';

export type ImageIn = { url: string; note: string };
export type ProductInput = {
  name: string;
  facts: string;
  price: number | null;
  category?: string;
  images: string[]; // raw lines: "https://... | what it shows"
  featured?: boolean;
};

const CITY_WORDS = ['hyderabad', 'visakhapatnam', 'vizag', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'pune', 'delhi', 'kolkata', 'vijayawada', 'secunderabad'];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Cloudinary pictures are served resized and in the best format for each visitor (faster pages). */
export function optimizeCloudinary(url: string) {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/);
  if (!m) return url;
  const rest = m[2];
  // already has a transformation (the first path part looks like f_auto,q_auto or w_800...)
  if (/^[a-z]{1,3}_[^/]+(,[a-z]{1,3}_[^/]+)*\//i.test(rest) && !/^v\d+\//.test(rest)) return url;
  return `${m[1]}f_auto,q_auto/${rest}`;
}

export function parseImages(lines: string[]): ImageIn[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [u, ...rest] = l.split('|');
      return { url: u.trim(), note: rest.join('|').trim() };
    })
    .filter((i) => /^https:\/\/\S+$/i.test(i.url));
}

/* ------------------------------------------------------------- prompt */

const SYSTEM = `You write the product page for Retreat Arcade, an event entertainment rental company (interactive games, 360-degree photo booths, VR simulators, AI experiences, arcade and team-building activities for corporate events, weddings, college fests, brand activations and birthdays). The product is rented out for events across India.

Hard rules
- Use ONLY: the owner's facts, what you can SEE in the pictures, and general knowledge of what this kind of product is. Never invent sizes, power needs, weight, setup time, capacity, guests per hour, operator numbers, prices, years, clients, reviews, awards or statistics. A price may be mentioned only as "starting from" the exact figure given; if no price is given, say nothing about price.
- Anything specific that you need and do not have (space needed, power, setup time, capacity, what is included, customisation) goes in questions_for_owner, NOT in the text. Ask at most 5 short questions, each with why it matters.
- Never say or imply where equipment comes from or is delivered from. Do not mention a specific city. The page serves all cities.
- No "best", "premier", "leading", "number one", "top", guarantees, or filler ("elevate your event", "unforgettable", "seamless").

What to write
- title: 35 to 60 characters, the product name with its natural search word (for example "rental"), no city. Built around the lead_phrase.
- slug: lower-case words with hyphens, from the title.
- summary: one or two sentences, up to 190 characters, what it is and who it suits.
- description_html: 300 to 600 words as HTML using only h2, h3, p, ul, ol, li, strong, em. Sections: what it is; how it works at an event (only what you know); who it suits (corporate events, weddings, college fests, brand activations, birthdays, as fits); what makes it a good choice. Short paragraphs. The lead_phrase appears in the first paragraph and one h2, naturally. NEVER write <a>, <img> or URLs.
- highlights: 5 to 7 short factual bullet points (no invented specifics).
- category: exactly one of the allowed categories supplied (pick the closest).
- meta_title: 45 to 60 characters, starts with the lead_phrase or its natural form, add " | Retreat Arcade" only if it still fits in 60. Include one real reason to choose it from the facts (not an invented one).
- meta_description: 120 to 155 characters, includes the lead_phrase, one benefit, a soft call to action.
- meta_keywords: 4 to 6 phrases people search (lower case), lead_phrase first.
- faqs: 4 or 5 questions a planner would ask, with answers you can give from the facts. If you cannot answer from the facts, use a general, honest answer (for example how to book) and not a specific number.
- image_alts: for every picture numbered n, an alt text (what is really visible, 5 to 16 words, no stuffing) and a short caption.`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    summary: { type: 'string' },
    description_html: { type: 'string' },
    highlights: { type: 'array', items: { type: 'string' } },
    category: { type: 'string' },
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    meta_keywords: { type: 'array', items: { type: 'string' } },
    faqs: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'], additionalProperties: false } },
    image_alts: { type: 'array', items: { type: 'object', properties: { n: { type: 'integer' }, alt: { type: 'string' }, caption: { type: 'string' } }, required: ['n', 'alt', 'caption'], additionalProperties: false } },
    questions_for_owner: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, why: { type: 'string' } }, required: ['q', 'why'], additionalProperties: false } },
  },
  required: ['title', 'slug', 'summary', 'description_html', 'highlights', 'category', 'meta_title', 'meta_description', 'meta_keywords', 'faqs', 'image_alts', 'questions_for_owner'],
  additionalProperties: false,
} as const;

type Gen = {
  title: string; slug: string; summary: string; description_html: string; highlights: string[]; category: string;
  meta_title: string; meta_description: string; meta_keywords: string[]; faqs: { q: string; a: string }[];
  image_alts: { n: number; alt: string; caption: string }[]; questions_for_owner: { q: string; why: string }[];
};

const BANNED = /\b(best|premier|leading|number one|no\.? ?1|#1|top|guarantee[sd]?)\b/i;

function check(g: Gen, leadTokens: string[], price: number | null): string[] {
  const p: string[] = [];
  const body = textOf(g.description_html);
  const wc = body.split(' ').filter(Boolean).length;
  if (g.title.length < 25 || g.title.length > 62) p.push(`title ${g.title.length} chars (need 35-60)`);
  if (g.meta_title.length < 35 || g.meta_title.length > 62) p.push(`meta_title ${g.meta_title.length} chars (need 45-60)`);
  if (g.meta_description.length < 110 || g.meta_description.length > 158) p.push(`meta_description ${g.meta_description.length} chars (need 120-155)`);
  if (g.summary.length < 40 || g.summary.length > 220) p.push(`summary ${g.summary.length} chars (need up to 190)`);
  if (wc < 220 || wc > 800) p.push(`description has ${wc} words (need 300-600)`);
  if (g.highlights.length < 4) p.push('need 5 to 7 highlights');
  if (g.faqs.length < 3) p.push('need 4 or 5 faqs');
  const all = [g.title, g.meta_title, g.meta_description, g.summary, body, g.highlights.join(' '), g.faqs.map((f) => f.q + ' ' + f.a).join(' ')].join(' ');
  if (CITY_WORDS.some((c) => new RegExp(`\\b${c}\\b`, 'i').test(all))) p.push('mentions a city (the page serves all cities)');
  if (BANNED.test(all)) p.push('banned word');
  if (/(deliver(ed|ing)?|shipped|dispatched|brought|transported)\s+(in\s+)?from\s+(our\s+|the\s+|a\s+)?(warehouse|stock|office|branch|base|hub|another city|elsewhere)|our (warehouse|stock|office|branch|studio)|stock(ed)? in/i.test(all)) p.push('mentions where equipment comes from');
  if (!price && /₹|\brs\.?\s?\d|\binr\b|\bprice from\b|\bstarting from\b/i.test(all)) p.push('mentions a price but none was given');
  if (/\b\d{2,}\+?\s*(events|clients|years|customers)\b/i.test(all)) p.push('contains an invented statistic');
  const lt = leadTokens.filter((w) => w.length > 2);
  if (lt.length && !lt.every((w) => g.title.toLowerCase().includes(w))) p.push('title must contain the lead phrase');
  return p;
}

/* ----------------------------------------------------------- duplicates */

export async function findSimilarProducts(db: SupabaseClient, name: string, exceptId?: string) {
  const { data } = await db.from('events').select('id, title, slug, status').limit(500);
  const mine = tokens(name);
  const out: { id: string; title: string; slug: string; status: string; score: number }[] = [];
  for (const e of (data as any[]) || []) {
    if (e.id === exceptId) continue;
    const t = tokens(e.title);
    let n = 0;
    mine.forEach((w) => t.has(w) && n++);
    const score = mine.size + t.size - n ? n / (mine.size + t.size - n) : 0;
    if (score >= 0.6) out.push({ id: e.id, title: String(e.title).trim(), slug: e.slug, status: e.status, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

/** The services that fit this product best (suggestions only; the owner ticks). */
export async function suggestServices(db: SupabaseClient, name: string, category: string) {
  const { data } = await db.from('services').select('id, title, slug, display_order, is_tech_service').eq('status', 'published');
  const list = ((data as any[]) || []).filter((s) => !s.is_tech_service);
  const text = `${name} ${category}`;
  const scored = list.map((s) => {
    let n = 0;
    const pt = tokens(text);
    tokens(s.title).forEach((w) => pt.has(w) && n++);
    return { ...s, score: n };
  });
  const best = choosePrimary(list.map((s) => ({ ...s })), text);
  return { all: scored.sort((a, b) => b.score - a.score || (a.display_order ?? 9999) - (b.display_order ?? 9999)), best: best?.id as string | undefined };
}

/* ------------------------------------------------------------- generate */

export async function writeProductDraft(db: SupabaseClient, input: ProductInput, opts: { productId?: string; launchId?: string } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const probe = await db.from('product_launches').select('id').limit(1);
  if (probe.error) throw new Error('Run AUTO_PAGES_STEP6.sql in Supabase first (it adds the product tables).');

  const name = input.name.trim();
  if (name.length < 3) throw new Error('Enter the product name.');
  const images = parseImages(input.images).map((i) => ({ ...i, url: optimizeCloudinary(i.url) }));
  if (!images.length) throw new Error('Add at least one picture link (https://...).');

  const similar = await findSimilarProducts(db, name, opts.productId);
  const exact = similar.find((s) => s.score >= 0.85);
  if (exact && !opts.productId) throw new Error(`"${exact.title}" already exists (${exact.status}). Edit that product instead, or give this one a clearly different name.`);

  const { data: catRows } = await db.from('events').select('category');
  const categories = Array.from(new Set(((catRows as any[]) || []).map((r) => String(r.category || '').trim()).filter(Boolean)));
  const lead = (await leadPhrasesFor(db, [{ id: 'p', name, cityNames: [] }])).get('p')!;

  const facts = {
    product_name: name,
    owner_facts: input.facts.trim() || '(none given)',
    price_inr_starting_from: input.price,
    allowed_categories: categories,
    preferred_category: input.category || null,
    lead_phrase: lead.phrase,
    searches_per_month_for_lead_phrase: lead.volume,
    other_phrases_people_search: lead.options.slice(1, 4).map((o) => o.phrase),
    pictures: images.map((im, i) => ({ n: i + 1, owner_note: im.note || null })),
  };

  const client = new Anthropic();
  const leadTokens = Array.from(tokens(lead.phrase)).filter((w) => !['rental', 'hire', 'rent', 'on'].includes(w));
  let withImages = true;
  let best: { g: Gen; problems: string[] } | null = null;
  let feedback = '';
  const started = Date.now();
  for (let attempt = 0; attempt < 3 && (attempt === 0 || Date.now() - started < 24000); attempt++) {
    const content: any[] = [{ type: 'text', text: `Facts (JSON):\n${JSON.stringify(facts, null, 2)}${feedback ? `\n\nYour previous attempt was rejected. Fix these:\n- ${feedback}` : ''}` }];
    if (withImages) images.slice(0, 8).forEach((im, i) => content.push({ type: 'text', text: `Picture ${i + 1}:` }, { type: 'image', source: { type: 'url', url: im.url } }));
    let res: any;
    try {
      res = await client.messages.create({
        model: GENERATOR_MODEL, max_tokens: 6000,
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
        messages: [{ role: 'user', content }],
      } as any);
    } catch (e: any) {
      if (withImages && /image|url|fetch|media/i.test(String(e?.message))) { withImages = false; attempt--; continue; } // a picture link the AI cannot open: write without looking
      throw e;
    }
    const block: any = res.content.find((b: any) => b.type === 'text');
    if (!block) throw new Error('Claude returned no text');
    const g = JSON.parse(block.text) as Gen;
    g.description_html = sanitizeHtml(g.description_html);
    const problems = check(g, leadTokens, input.price);
    if (!best || problems.length < best.problems.length) best = { g, problems };
    if (!problems.length) break;
    feedback = problems.join('\n- ');
  }
  if (!best) throw new Error('No draft was produced');
  if (best.problems.some((p) => /mentions a city|banned|where equipment|invented|price but none/.test(p))) throw new Error(`The writer could not meet the safety rules: ${best.problems.join('; ')}. Try again, or add more facts.`);

  const g = best.g;
  let slug = slugify(g.slug || g.title);
  for (let n = 2; ; n++) {
    const { data: ex } = await db.from('events').select('id').eq('slug', slug).neq('id', opts.productId || '00000000-0000-0000-0000-000000000000').maybeSingle();
    if (!ex) break;
    slug = `${slugify(g.slug || g.title)}-${n}`;
  }
  const note = best.problems.length ? ` | needs review: ${best.problems.join('; ')}` : '';
  const alt = (n: number) => g.image_alts.find((a) => a.n === n);
  const row: Record<string, any> = {
    title: g.title.trim(),
    slug,
    summary: g.summary.trim(),
    description: g.description_html,
    image_url: images[0].url,
    gallery_images: images.slice(1).map((im) => im.url),
    category: categories.includes(g.category) ? g.category : input.category || g.category,
    price: input.price,
    status: 'draft',
    is_featured: !!input.featured,
    highlights: g.highlights,
    meta_title: g.meta_title.trim(),
    meta_description: g.meta_description.trim(),
    meta_keywords: g.meta_keywords,
    published_at: null,
    updated_at: new Date().toISOString(),
  };
  const extra = { faqs: g.faqs, focus_keyword: lead.phrase, image_alts: images.map((im, i) => alt(i + 1)?.alt || im.note || ''), generated_by: GENERATOR_MODEL + note, generated_at: new Date().toISOString() };

  let productId = opts.productId;
  if (productId) {
    let u = await db.from('events').update({ ...row, ...extra }).eq('id', productId);
    if (u.error && /faqs|focus_keyword|image_alts|generated_/i.test(u.error.message || '')) u = await db.from('events').update(row).eq('id', productId);
    if (u.error) throw u.error;
  } else {
    let ins: any = await db.from('events').insert({ ...row, ...extra }).select('id').single();
    if (ins.error && /faqs|focus_keyword|image_alts|generated_/i.test(ins.error.message || '')) ins = await db.from('events').insert(row).select('id').single();
    if (ins.error) throw ins.error;
    productId = ins.data.id;
  }

  const questions = g.questions_for_owner.slice(0, 5);
  const launchRow = { product_id: productId, input: { ...input, images: input.images }, questions, updated_at: new Date().toISOString() };
  let launchId = opts.launchId;
  if (launchId) await db.from('product_launches').update(launchRow).eq('id', launchId);
  else {
    const ins = await db.from('product_launches').insert({ ...launchRow, stage: 'draft' }).select('id').single();
    if (ins.error) throw ins.error;
    launchId = (ins.data as any).id;
  }

  const sug = await suggestServices(db, g.title, row.category);
  return {
    launchId, productId, slug, title: g.title, problems: best.problems, questions, lead: { phrase: lead.phrase, volume: lead.volume },
    similar, imagesSeen: withImages, altTexts: images.map((im, i) => ({ url: im.url, alt: alt(i + 1)?.alt || im.note || '', caption: alt(i + 1)?.caption || '' })),
    suggestedServiceIds: sug.all.filter((s) => s.score > 0).slice(0, 3).map((s) => s.id),
  };
}
