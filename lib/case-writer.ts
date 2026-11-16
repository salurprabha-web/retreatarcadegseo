/**
 * Helps turn your real notes and photos into a readable case study (server only).
 * It tidies what YOU wrote and describes what is visible in YOUR pictures. It never invents details,
 * guest numbers, names, results or quotes. If your notes are short, the story is short.
 */
import Anthropic from '@anthropic-ai/sdk';
import { GENERATOR_MODEL } from '@/lib/page-generator';
import { optimizeCloudinary } from '@/lib/product-writer';

export type TidyInput = {
  title: string; cityName?: string; area?: string; eventType?: string; eventDate?: string; guests?: string;
  productNames: string[]; notes: string; photos: { url: string; note?: string }[];
};

const SYSTEM = `You help a small event entertainment rental company (Retreat Arcade) publish an honest case study of a REAL event they delivered. The owner supplies their own notes and pictures.

Hard rules
- The story may only contain facts that are in the owner's notes, the details given (city, area, event type, date, guests, products used), or clearly visible in the pictures. Never invent guests numbers, results, reactions, names, companies, quotes, awards or any detail not given. If the notes are short, write a short story (80 to 150 words). Longer notes allow up to 300 words.
- Plain, concrete, friendly language in 2 to 4 short paragraphs (blank line between paragraphs). No headings, no bullet lists, no exaggeration.
- No "best", "premier", "leading", "unforgettable", "seamless", guarantees. Do not say or imply where equipment came from or was delivered from. Mention no city other than the event's city.
- Mention the city, the event type and the products used naturally once.
- For each picture n, write alt text of what is really visible (5 to 16 words) and a short caption (max 12 words) that uses only given facts.
- title: if the owner's title is empty or weak, suggest a clear one of 35 to 60 characters like "Photo Booth and Games at a Corporate Annual Day in Hyderabad"; otherwise return it unchanged.
- meta_title: 45 to 60 characters including the city and the event type. meta_description: 120 to 155 characters, honest, includes the city. focus_keyword: the phrase a planner in that city would search, for example "corporate event entertainment hyderabad".`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    story: { type: 'string' },
    meta_title: { type: 'string' },
    meta_description: { type: 'string' },
    focus_keyword: { type: 'string' },
    photos: { type: 'array', items: { type: 'object', properties: { n: { type: 'integer' }, alt: { type: 'string' }, caption: { type: 'string' } }, required: ['n', 'alt', 'caption'], additionalProperties: false } },
  },
  required: ['title', 'story', 'meta_title', 'meta_description', 'focus_keyword', 'photos'],
  additionalProperties: false,
} as const;

export async function tidyCaseStudy(input: TidyInput) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  if (!input.notes.trim() && !input.photos.length) throw new Error('Add your notes about the event (even a few bullet points) and at least one picture first.');
  const photos = input.photos.filter((p) => /^https:\/\/\S+$/i.test(p.url)).slice(0, 10).map((p) => ({ ...p, url: optimizeCloudinary(p.url) }));
  const facts = {
    owner_title: input.title || null, city: input.cityName || null, area: input.area || null, event_type: input.eventType || null,
    event_date: input.eventDate || null, guests: input.guests || null, products_used: input.productNames, owner_notes: input.notes.trim() || '(none)',
    pictures: photos.map((p, i) => ({ n: i + 1, owner_note: p.note || null })),
  };
  const client = new Anthropic();
  const build = (withImages: boolean) => {
    const content: any[] = [{ type: 'text', text: `Facts (JSON):\n${JSON.stringify(facts, null, 2)}` }];
    if (withImages) photos.slice(0, 8).forEach((p, i) => content.push({ type: 'text', text: `Picture ${i + 1}:` }, { type: 'image', source: { type: 'url', url: p.url } }));
    return content;
  };
  const call = (withImages: boolean) => client.messages.create({
    model: GENERATOR_MODEL, max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
    messages: [{ role: 'user', content: build(withImages) }],
  } as any);
  let res: any;
  let seen = true;
  try { res = await call(true); } catch (e: any) {
    if (/image|url|fetch|media/i.test(String(e?.message))) { seen = false; res = await call(false); } else throw e;
  }
  const block: any = res.content.find((b: any) => b.type === 'text');
  if (!block) throw new Error('Claude returned no text');
  const g = JSON.parse(block.text);
  const other = /\b(hyderabad|visakhapatnam|vizag|bangalore|bengaluru|chennai|mumbai|pune|delhi|kolkata)\b/gi;
  const own = String(input.cityName || '').toLowerCase();
  const stray = (String(g.story + ' ' + g.meta_description).match(other) || []).filter((c) => c.toLowerCase() !== own && !(own === 'visakhapatnam' && c.toLowerCase() === 'vizag'));
  return { ...g, photos: photos.map((p, i) => ({ url: input.photos[i]?.url || p.url, alt: g.photos.find((x: any) => x.n === i + 1)?.alt || p.note || '', caption: g.photos.find((x: any) => x.n === i + 1)?.caption || '' })), imagesSeen: seen, warning: stray.length ? `The text mentions ${Array.from(new Set(stray)).join(', ')}. Please check it.` : '' };
}
