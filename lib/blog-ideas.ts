/**
 * Blog ideas and outlines (server only).
 * Ideas are built from YOUR keyword list: free phrases (no page owns them yet) with the most searches, turned into
 * useful posts for event planners. Nothing is saved here; the owner approves the outline before any post is written.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GENERATOR_MODEL } from '@/lib/page-generator';
import { findCity } from '@/lib/city-data';
import { tokens } from '@/lib/primary-pick';

export type Idea = {
  title: string; angle: string; keyword: string; volume: number | null; city_slug: string | null;
  post_type: string; product_slug: string; service_slug: string; why: string;
};

const IDEA_SYSTEM = `You plan blog posts for Retreat Arcade, an event entertainment rental company (interactive games, 360-degree photo booths, VR simulators, AI experiences, arcade and team-building activities for corporate events, weddings, college fests, brand activations and birthdays). The blog's job is to rank on Google for useful searches and bring enquiries from event planners.

You get a list of search phrases nobody on the site targets yet (with monthly searches where known), the company's products and services, and the posts that already exist.

Write 10 blog post ideas. Rules
- Each idea targets exactly ONE phrase copied EXACTLY from the list. Prefer phrases with more searches. Use each phrase at most once.
- Turn the phrase into something genuinely useful to a planner, not a sales page: cost guides ("How much does ... cost in <city>"), idea lists, how-to guides, checklists, comparisons ("X or Y for a <event>"). Mix the types.
- title: 35 to 60 characters, includes the phrase's main words and the city when the phrase has one. Written for a person.
- angle: one sentence on what the reader will learn.
- why: one sentence on why this reader is a likely enquiry.
- product_slug / service_slug: pick the ONE best matching product and service from the lists (copy the slug exactly), or an empty string.
- Never promise prices, numbers or results in a title. Do not repeat or closely copy the existing posts.`;

const IDEA_SCHEMA = {
  type: 'object',
  properties: { ideas: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, angle: { type: 'string' }, keyword: { type: 'string' }, post_type: { type: 'string' }, product_slug: { type: 'string' }, service_slug: { type: 'string' }, why: { type: 'string' } }, required: ['title', 'angle', 'keyword', 'post_type', 'product_slug', 'service_slug', 'why'], additionalProperties: false } } },
  required: ['ideas'],
  additionalProperties: false,
} as const;

const jacc = (a: Set<string>, b: Set<string>) => { let n = 0; a.forEach((x) => b.has(x) && n++); return a.size + b.size - n ? n / (a.size + b.size - n) : 0; };

export async function suggestBlogIdeas(db: SupabaseClient, opts: { citySlug?: string }): Promise<{ ideas: Idea[]; note?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const probe = await db.from('seo_keywords').select('id').limit(1);
  if (probe.error) return { ideas: [], note: 'Run AUTO_PAGES_STEP5.sql first, then open Keywords and press "Add ideas for every city".' };

  let q = db.from('seo_keywords').select('keyword, city_slug, volume, intent').eq('owner_type', 'none').order('volume', { ascending: false, nullsFirst: false }).limit(120);
  if (opts.citySlug) q = q.eq('city_slug', opts.citySlug);
  const { data: pool } = await q;
  // informational phrases first, then the buying ones (they become cost guides and comparisons)
  const phrases = ((pool as any[]) || []).sort((a, b) => Number(b.intent === 'info') - Number(a.intent === 'info') || (b.volume ?? -1) - (a.volume ?? -1)).slice(0, 50);
  if (!phrases.length) return { ideas: [], note: 'No free phrases yet. Open Keywords and press "Add ideas for every city".' };

  const [{ data: posts }, { data: prods }, { data: svcs }] = await Promise.all([
    db.from('blog_posts').select('title').limit(80),
    db.from('events').select('slug, title').eq('status', 'published').limit(80),
    db.from('services').select('slug, title, is_tech_service').eq('status', 'published'),
  ]);
  const existingTitles = ((posts as any[]) || []).map((p) => String(p.title));

  const client = new Anthropic();
  const res: any = await client.messages.create({
    model: GENERATOR_MODEL,
    max_tokens: 4000,
    system: [{ type: 'text', text: IDEA_SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: IDEA_SCHEMA as any } } as any,
    messages: [{ role: 'user', content: JSON.stringify({
      free_phrases: phrases.map((p) => ({ phrase: p.keyword, city: p.city_slug, monthly_searches: p.volume })),
      products: ((prods as any[]) || []).map((p) => ({ slug: p.slug, name: String(p.title).trim() })),
      services: ((svcs as any[]) || []).filter((s) => !s.is_tech_service).map((s) => ({ slug: s.slug, name: String(s.title).trim() })),
      existing_posts: existingTitles,
    }) }],
  } as any);
  const block = res.content.find((b: any) => b.type === 'text');
  if (!block) throw new Error('Claude returned no text');
  const raw = JSON.parse(block.text).ideas as any[];

  const byPhrase = new Map(phrases.map((p) => [String(p.keyword).toLowerCase().trim(), p]));
  const prodSlugs = new Set(((prods as any[]) || []).map((p) => p.slug));
  const svcSlugs = new Set(((svcs as any[]) || []).map((s) => s.slug));
  const used = new Set<string>();
  const out: Idea[] = [];
  for (const i of raw) {
    const key = String(i.keyword || '').toLowerCase().trim();
    const row = byPhrase.get(key);
    if (!row || used.has(key)) continue; // the keyword must be one of YOUR free phrases
    if (existingTitles.some((t) => jacc(tokens(t), tokens(i.title)) >= 0.6)) continue; // not a repeat of an existing post
    used.add(key);
    out.push({
      title: String(i.title).trim(), angle: String(i.angle).trim(), keyword: row.keyword, volume: row.volume ?? null, city_slug: row.city_slug || null,
      post_type: String(i.post_type || ''), product_slug: prodSlugs.has(i.product_slug) ? i.product_slug : '', service_slug: svcSlugs.has(i.service_slug) ? i.service_slug : '', why: String(i.why).trim(),
    });
  }
  return { ideas: out.slice(0, 10) };
}

/* ------------------------------------------------------------------ outline */

export type Outline = { title: string; sections: { heading: string; points: string[] }[]; faq_questions: string[] };

const OUTLINE_SYSTEM = `You prepare the outline of a blog post for Retreat Arcade (event entertainment rentals) so the owner can approve it before it is written.

Rules
- 5 to 7 sections. Each has a clear heading (natural wording, the focus keyword's main words appear in the first section or one heading) and 2 to 4 short points saying what that section will cover.
- Points must describe what to cover, never claims. Do not invent prices, numbers, statistics, client names or results. If the owner's notes give facts, mention which section uses them.
- Cover what a planner really needs to decide: options, how to choose, what to ask, typical mistakes, how booking works. End with a short section that leads towards getting a quote.
- faq_questions: 4 or 5 questions real planners ask about this topic.
- Mention only the post's own city. No "best", "number one", or guarantees.
- title: 35 to 60 characters, includes the keyword's main words.`;

const OUTLINE_SCHEMA = {
  type: 'object',
  properties: { title: { type: 'string' }, sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, points: { type: 'array', items: { type: 'string' } } }, required: ['heading', 'points'], additionalProperties: false } }, faq_questions: { type: 'array', items: { type: 'string' } } },
  required: ['title', 'sections', 'faq_questions'],
  additionalProperties: false,
} as const;

export async function makeOutline(db: SupabaseClient, input: { keyword: string; title?: string; angle?: string; citySlug?: string | null; productSlug?: string | null; serviceSlug?: string | null; notes?: string }): Promise<Outline> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const city = input.citySlug ? await findCity(input.citySlug) : undefined;
  const product = input.productSlug ? (await db.from('events').select('title, summary, price, category').eq('slug', input.productSlug).maybeSingle()).data : null;
  const service = input.serviceSlug ? (await db.from('services').select('title, summary').eq('slug', input.serviceSlug).maybeSingle()).data : null;
  const client = new Anthropic();
  const res: any = await client.messages.create({
    model: GENERATOR_MODEL,
    max_tokens: 2500,
    system: [{ type: 'text', text: OUTLINE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTLINE_SCHEMA as any } } as any,
    messages: [{ role: 'user', content: JSON.stringify({
      focus_keyword: input.keyword, working_title: input.title || null, angle: input.angle || null, owner_notes: input.notes || null,
      city: city ? { name: city.name, alias: city.alias || null, areas: city.areas.slice(0, 8) } : null,
      product: product ? { name: (product as any).title, summary: (product as any).summary, starting_price_inr: (product as any).price || null } : null,
      service: service ? { name: (service as any).title } : null,
    }) }],
  } as any);
  const block = res.content.find((b: any) => b.type === 'text');
  if (!block) throw new Error('Claude returned no text');
  const g = JSON.parse(block.text);
  return { title: String(g.title).trim(), sections: (g.sections || []).slice(0, 8).map((s: any) => ({ heading: String(s.heading).trim(), points: (s.points || []).map((p: any) => String(p).trim()).filter(Boolean) })), faq_questions: (g.faq_questions || []).map((q: any) => String(q).trim()).filter(Boolean).slice(0, 6) };
}
