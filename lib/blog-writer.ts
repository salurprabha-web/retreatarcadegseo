/**
 * AI blog writer (server only).
 * Writes a draft into the existing blog_posts table. Nothing is public until an admin publishes or schedules it.
 *
 * Guarantees:
 *  - the target keyword is free (no other page/post owns it) and is claimed by the post
 *  - links are only to real pages from the link graph (the model uses markers, the server writes the <a> tags)
 *  - images are only the links the admin supplied (the model uses markers, the server writes the <img> tags)
 *  - same safety checks as the page writer (no other cities, no stock origin, no invented figures...)
 */
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findCity } from '@/lib/city-data';
import { getLinkCandidates, type LinkTarget } from '@/lib/link-graph';
import { claimKeyword, getKeywordOwner, keyOf } from '@/lib/keywords';
import { GENERATOR_MODEL } from '@/lib/page-generator';

export type BlogInput = {
  idea: string;
  keyword: string;
  citySlug?: string | null;
  productSlug?: string | null;
  serviceSlug?: string | null;
  /** one per line: "https://...  |  what the picture shows" */
  images?: string[];
};

type Img = { url: string; note: string };
type BlogGen = {
  title: string; slug: string; meta_title: string; meta_description: string; excerpt: string; category: string;
  tags: string[]; reading_minutes: number; content_html: string;
  faqs: { q: string; a: string }[]; image_alts: { n: number; alt: string; caption: string }[];
};

const CATEGORIES = ['Corporate Events', 'Wedding Planning', 'Event Planning', 'College Events', 'Brand Activation', 'Photo Booths'];

/* ----------------------------------------------------------------- prompt */

const SYSTEM = `You write blog posts for Retreat Arcade, an event entertainment rental company (interactive games, 360-degree photo booths, VR simulators, AI experiences and team-building activities for corporate events, weddings, college fests, brand activations and birthdays). The posts help people plan events and find the right entertainment, and bring enquiries.

Hard rules
- Use ONLY the supplied facts. Never invent prices, years in business, number of events, awards, reviews, client names, addresses, phone numbers or statistics. A price may be mentioned only as "starting from" the exact figure given in the facts.
- Never say or imply where equipment comes from or is delivered from. Never mention an office, warehouse or branch unless the facts say the city is the home city.
- Never mention any city other than the post's own city (and nearby places supplied). If there is no city, write for India in general.
- No "best", "number one", "leading", guarantees or filler such as "in today's fast-paced world", "elevate your event", "unforgettable", "seamless".
- Plain, concrete, helpful English for a person planning an event. Short paragraphs.

Structure (output the body as HTML in content_html)
- Start with <p><strong>Quick answer:</strong> ...</p>: a direct 2 to 3 sentence answer to what the reader searched. This is what AI search tools will quote.
- Then a short intro paragraph, then 5 to 7 <h2> sections (use <h3> sparingly), bullet lists where they help, and one comparison <table> if it fits naturally.
- A final <h2>Frequently asked questions</h2> with 4 or 5 questions as <h3> followed by <p> answers. Return the same questions and answers in the faqs field.
- End with one short call-to-action paragraph that links to the planner and to the contact page using link markers.
- Allowed HTML only: h2 h3 p ul ol li strong em table thead tbody tr th td blockquote. NEVER write <a> or <img> yourself.
- Body length: 1000 to 1500 words.

Keyword
- The focus keyword must appear in the title, in the first paragraph, in at least one <h2>, and 3 to 5 times in total, naturally. Do not stuff it.

Links (mandatory)
- "links" lists real pages with ids. Use 4 to 7 of them inside the text with the marker [[link:ID|anchor text]], for example [[link:L3|photo booth rental in Hyderabad]]. Use each id at most once, put each in a sentence where it helps the reader, anchor text of 2 to 6 words that reads naturally (vary the wording, do not always repeat the keyword). Always use the planner link and the contact link once each near the end. Prefer service and product pages, and one related post if present.
- Never write any URL yourself.

Images
- "images" lists pictures the admin supplied, numbered. Place EVERY image exactly once, where it fits, with the marker [[img:N]] on its own line between paragraphs. Never invent images. Give each a descriptive alt text (no keyword stuffing) and a short caption in image_alts.

Other fields
- title: 35 to 60 characters, includes the focus keyword naturally, written for a human.
- meta_title: same as title or a shorter variant, 60 characters or fewer.
- meta_description: 120 to 155 characters, includes the keyword, a clear reason to click.
- excerpt: one or two sentences, up to 200 characters.
- slug: lower-case words with hyphens, includes the keyword, no city other than the post's city.
- category: exactly one of the allowed categories supplied. tags: 3 to 6 short tags.
- reading_minutes: honest estimate as an integer.`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    excerpt: { type: 'string' },
    category: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    reading_minutes: { type: 'integer' },
    content_html: { type: 'string' },
    faqs: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'], additionalProperties: false } },
    image_alts: { type: 'array', items: { type: 'object', properties: { n: { type: 'integer' }, alt: { type: 'string' }, caption: { type: 'string' } }, required: ['n', 'alt', 'caption'], additionalProperties: false } },
  },
  required: ['title', 'slug', 'meta_title', 'meta_description', 'excerpt', 'category', 'tags', 'reading_minutes', 'content_html', 'faqs', 'image_alts'],
  additionalProperties: false,
} as const;

/* ------------------------------------------------------------- text tools */

const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const wordsOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
const shingles = (s: string, n = 4) => {
  const w = wordsOf(s);
  const o = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) o.add(w.slice(i, i + n).join(' '));
  return o;
};
const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  a.forEach((x) => b.has(x) && n++);
  return n / (a.size + b.size - n);
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

/** Removes anything that could run code or break the page. The model is told not to write these, this is the safety net. */
export function sanitizeHtml(html: string) {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    // the model must not write its own links or images
    .replace(/<\s*\/?\s*a\b[^>]*>/gi, '')
    .replace(/<\s*img\b[^>]*>/gi, '');
}

/** Turns [[link:ID|anchor]] and [[img:N]] markers into real tags; drops unknown ids. */
export function resolveMarkers(html: string, links: LinkTarget[], images: Img[], alts: BlogGen['image_alts']) {
  const byId = new Map(links.map((l) => [l.id, l]));
  const used = new Set<string>();
  let out = html.replace(/\[\[link:([A-Za-z0-9]+)\|([^\]]{2,80})\]\]/g, (_m, id: string, anchor: string) => {
    const t = byId.get(id);
    if (!t || used.has(id)) return esc(anchor);
    used.add(id);
    return `<a href="${t.url}">${esc(anchor)}</a>`;
  });
  out = out.replace(/\[\[link:[^\]]*\]\]/g, '');

  const placed = new Set<number>();
  out = out.replace(/(?:<p>\s*)?\[\[img:(\d+)\]\](?:\s*<\/p>)?/g, (_m, n: string) => {
    const i = Number(n);
    const img = images[i - 1];
    if (!img || placed.has(i)) return '';
    placed.add(i);
    const a = alts.find((x) => x.n === i);
    const alt = esc(a?.alt || img.note || 'Event photo');
    const cap = a?.caption ? `<figcaption>${esc(a.caption)}</figcaption>` : '';
    return `<figure><img src="${esc(img.url)}" alt="${alt}" loading="lazy" style="border-radius:12px;width:100%;height:auto" />${cap}</figure>`;
  });
  // any picture the writer forgot is placed after an evenly spaced <h2> section, so every supplied image is used
  const missing = images.map((_, k) => k + 1).filter((i) => !placed.has(i));
  if (missing.length) {
    const parts = out.split(/(?=<h2)/);
    missing.forEach((i, k) => {
      const at = Math.min(parts.length - 1, 1 + Math.floor(((k + 1) * (parts.length - 1)) / (missing.length + 1)));
      const a = alts.find((x) => x.n === i);
      parts[at] = parts[at] + `<figure><img src="${esc(images[i - 1].url)}" alt="${esc(a?.alt || images[i - 1].note || 'Event photo')}" loading="lazy" style="border-radius:12px;width:100%;height:auto" /></figure>`;
    });
    out = parts.join('');
  }
  return { html: out, linksUsed: used.size, linkUrls: Array.from(used).map((id) => byId.get(id)!.url) };
}

/* ---------------------------------------------------------------- quality */

export function checkBlog(g: BlogGen, ctx: { keyword: string; cityName?: string; cityAlias?: string | null; otherCities: string[]; existingTitles: Set<string>; existingText: Set<string>[] }, resolved: { html: string; linksUsed: number }) {
  const p: string[] = [];
  const body = textOf(resolved.html);
  const wc = wordsOf(body).length;
  if (g.title.length < 25 || g.title.length > 66) p.push(`title length ${g.title.length} (need 35-60)`);
  if (g.meta_description.length < 100 || g.meta_description.length > 165) p.push(`meta_description length ${g.meta_description.length} (need 120-155)`);
  if (wc < 850 || wc > 2000) p.push(`body has ${wc} words (need 1000-1500)`);
  if (resolved.linksUsed < 3) p.push(`only ${resolved.linksUsed} internal links (need 4-7)`);
  if (g.faqs.length < 4 || g.faqs.length > 6) p.push('need 4 or 5 faqs');
  const kwTokens = wordsOf(ctx.keyword).filter((w) => w !== 'in' && w !== 'for');
  const hasAll = (text: string) => kwTokens.every((t) => text.toLowerCase().includes(t));
  if (!hasAll(g.title)) p.push('title must contain the focus keyword');
  if (!hasAll(wordsOf(body).slice(0, 140).join(' '))) p.push('first paragraph must contain the focus keyword');
  const h2s = (resolved.html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []).map(textOf);
  if (!h2s.some(hasAll)) p.push('at least one h2 must contain the focus keyword');

  const all = [g.title, g.meta_description, g.excerpt, body].join(' ');
  for (const c of ctx.otherCities) {
    if (c && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(all)) p.push(`mentions another city: ${c}`);
  }
  if (/(deliver(ed|ing)?|shipped|dispatched|brought|transported)\s+(in\s+)?from\s+(our\s+|the\s+|a\s+)?(warehouse|stock|office|branch|base|hub|another city|elsewhere)|our (warehouse|stock|office|branch|studio)|stock(ed)? in/i.test(all)) p.push('mentions where equipment comes from');
  if (/\b(best|number one|no\.? ?1|#1|leading|guarantee[sd]?)\b/i.test(all)) p.push('uses a banned superlative or guarantee');
  if (/\b\d{2,}\+?\s*(events|clients|years|customers)\b/i.test(all)) p.push('contains an invented statistic');
  if (ctx.existingTitles.has(g.title.trim().toLowerCase())) p.push('title duplicates an existing post');
  const sh = shingles(body);
  for (const o of ctx.existingText) if (jaccard(sh, o) > 0.22) { p.push('too similar to an existing post'); break; }
  return p;
}

const HARD = /another city|where equipment|banned|invented/;

/* --------------------------------------------------------------- generate */

export async function generateBlogPost(db: SupabaseClient, input: BlogInput) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const keyword = input.keyword.trim();
  if (keyword.length < 4) throw new Error('Choose a main keyword for the post.');

  const owner = await getKeywordOwner(db, keyword);
  if (owner) throw new Error(`"${keyword}" already belongs to ${owner.owner_url}. Pick a different keyword, or write about a different angle (for example add "cost", "ideas" or "checklist").`);

  const images: Img[] = (input.images || [])
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [u, ...rest] = l.split('|');
      return { url: u.trim(), note: rest.join('|').trim() };
    })
    .filter((i) => /^https:\/\/\S+$/i.test(i.url));

  const city = input.citySlug ? await findCity(input.citySlug) : undefined;
  const { data: cityRow } = input.citySlug ? await db.from('locations').select('*').eq('slug', input.citySlug).maybeSingle() : { data: null };
  const { data: allCities } = await db.from('locations').select('city, alias');
  const otherCities = ((allCities as any[]) || []).flatMap((c) => [c.city, c.alias]).filter((n: string) => n && n !== city?.name && n !== city?.alias && n !== (cityRow as any)?.city && n !== (cityRow as any)?.alias);

  let product: any = null;
  if (input.productSlug) product = (await db.from('events').select('title, summary, price, category, highlights').eq('slug', input.productSlug).maybeSingle()).data;
  let service: any = null;
  if (input.serviceSlug) service = (await db.from('services').select('title, summary').eq('slug', input.serviceSlug).maybeSingle()).data;

  const links = await getLinkCandidates({ citySlug: city?.slug || null });
  const { data: existing } = await db.from('blog_posts').select('title, slug, content, focus_keyword').limit(300);
  const existingTitles = new Set(((existing as any[]) || []).map((p) => String(p.title).trim().toLowerCase()));
  const existingText = ((existing as any[]) || []).map((p) => shingles(textOf(String(p.content || ''))));

  const strip = (t: string) => String(t || '').replace(new RegExp(`\\s*\\b(?:in|for|at)?\\s*(?:${otherCities.map((c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '$^'})\\b`, 'gi'), ' ').replace(/\s{2,}/g, ' ').trim();
  const facts = {
    idea: input.idea,
    focus_keyword: keyword,
    allowed_categories: CATEGORIES,
    city: city
      ? { name: city.name, also_known_as: city.alias || null, state: city.state, is_home_city: !!city.home, home_base_area: city.home ? 'Madhapur' : null, areas: (cityRow as any)?.areas?.length ? (cityRow as any).areas : city.areas, venues: (cityRow as any)?.venues?.length ? (cityRow as any).venues : city.venues, nearby: city.nearby || [], notes: (cityRow as any)?.local_notes || null }
      : null,
    product: product ? { name: strip(product.title), summary: strip(product.summary), category: product.category, starting_price_inr: product.price ? Number(product.price) : null, highlights: (product.highlights || []).slice(0, 6).map(strip) } : null,
    service: service ? { name: strip(service.title), summary: strip(service.summary) } : null,
    other_posts_already_on_the_blog: ((existing as any[]) || []).slice(0, 25).map((p) => p.title),
    links: links.map((l) => ({ id: l.id, type: l.kind, page: l.label })),
    images: images.map((im, i) => ({ n: i + 1, shows: im.note || 'event photo' })),
  };

  const client = new Anthropic();
  const ctx = { keyword, cityName: city?.name, cityAlias: city?.alias, otherCities, existingTitles, existingText };

  let best: { g: BlogGen; html: string; problems: string[]; linkUrls: string[] } | null = null;
  let feedback = '';
  const started = Date.now();
  // the request has about a minute: a second try only starts if the first one was quick
  for (let attempt = 0; attempt < 3 && (attempt === 0 || Date.now() - started < 24000); attempt++) {
    const res = await client.messages.create({
      model: GENERATOR_MODEL,
      max_tokens: 7000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
      messages: [{ role: 'user', content: `Facts (JSON):\n${JSON.stringify(facts, null, 2)}${feedback ? `\n\nYour previous attempt was rejected. Fix these:\n- ${feedback}` : ''}` }],
    } as any);
    const block: any = (res as any).content.find((b: any) => b.type === 'text');
    if (!block) throw new Error('Claude returned no text');
    const g = JSON.parse(block.text) as BlogGen;
    const resolved = resolveMarkers(sanitizeHtml(g.content_html), links, images, g.image_alts || []);
    const problems = checkBlog(g, ctx, resolved);
    if (!best || problems.length < best.problems.length) best = { g, html: resolved.html, problems, linkUrls: resolved.linkUrls };
    if (!problems.length) break;
    feedback = problems.join('\n- ');
  }
  if (!best) throw new Error('No draft was produced');
  if (best.problems.some((p) => HARD.test(p))) throw new Error(`The writer could not meet the safety rules: ${best.problems.join('; ')}. Try again, or change the idea.`);

  // unique slug
  let slug = slugify(best.g.slug || best.g.title);
  for (let n = 2; ; n++) {
    const { data: ex } = await db.from('blog_posts').select('id').eq('slug', slug).maybeSingle();
    if (!ex) break;
    slug = `${slugify(best.g.slug || best.g.title)}-${n}`;
  }

  const note = best.problems.length ? ` | needs review: ${best.problems.join('; ')}` : '';
  const hero = images[0]?.url || null;
  const base: Record<string, any> = {
    title: best.g.title.trim(),
    slug,
    excerpt: best.g.excerpt.trim(),
    content: best.html,
    author_name: 'Retreat Arcade Team',
    category: CATEGORIES.includes(best.g.category) ? best.g.category : 'Event Planning',
    featured_image_url: hero,
    og_image_url: hero,
    content_images: images.map((im, i) => ({ url: im.url, alt: best!.g.image_alts.find((a) => a.n === i + 1)?.alt || im.note || '' })),
    reading_time: `${Math.max(3, Math.round(best.g.reading_minutes || 6))} min read`,
    meta_title: best.g.meta_title.trim(),
    meta_description: best.g.meta_description.trim(),
    meta_keywords: [keyword, ...best.g.tags].slice(0, 8),
    tags: best.g.tags,
    noindex: false,
    status: 'draft',
    published_at: null,
  };
  const extra = {
    city_slug: city?.slug || null,
    product_slug: input.productSlug || null,
    service_slug: input.serviceSlug || null,
    focus_keyword: keyword,
    faqs: best.g.faqs,
    generated_by: GENERATOR_MODEL + note,
    generated_at: new Date().toISOString(),
  };
  let ins = await db.from('blog_posts').insert({ ...base, ...extra }).select('id, slug').single();
  if (ins.error && /city_slug|product_slug|service_slug|focus_keyword|faqs|generated_/i.test(ins.error.message || '')) {
    ins = await db.from('blog_posts').insert(base).select('id, slug').single(); // STEP5 SQL not run yet: save without the extra columns
  }
  if (ins.error) throw ins.error;

  await claimKeyword(db, { keyword, citySlug: city?.slug || null, intent: 'info', owner: { type: 'blog', ref: (ins.data as any).id, url: `/blog/${(ins.data as any).slug}` } });
  return { id: (ins.data as any).id, slug: (ins.data as any).slug, title: best.g.title, problems: best.problems, links: best.linkUrls.length, images: images.length };
}

export { keyOf };
