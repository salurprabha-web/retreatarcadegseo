/**
 * Fills a city's profile automatically (server only): nickname, areas, typical venue types, nearby towns,
 * coordinates and a short note. Only EMPTY fields are filled; nothing you typed is ever overwritten.
 *  - Hyderabad and Visakhapatnam use the hand-written details already in lib/cities.ts (no AI).
 *  - Every other city is filled by Claude from general knowledge, then checked (coordinates must be inside India,
 *    lists must look real). Anything the AI is not sure about is left empty rather than guessed.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CITIES } from '@/lib/cities';

const MODEL = 'claude-sonnet-5-5';

const SYSTEM = `You prepare the factual profile of an Indian city for an event entertainment rental company's website. The profile is used to write local pages, so accuracy matters more than length.

Rules
- areas: 10 to 14 REAL neighbourhoods, localities or business districts of that city where corporate events, weddings, college fests and parties commonly happen. Only names you are confident exist in that city.
- venues: 5 short VENUE TYPES (for example "Hotels, banquet halls and convention centres"), not specific business names.
- nearby: 3 to 5 real towns or suburbs close to the city. Leave empty if unsure.
- alias: the short nickname people commonly search instead of the full city name (for example "Vizag" for Visakhapatnam, "Bengaluru" for Bangalore). Empty string if there is none.
- lat, lng: approximate centre of the city in decimal degrees.
- notes: one or two short, general sentences about the event season or popular event types in that city ONLY if you are confident (for example the main wedding season). Otherwise an empty string. Never invent facts about the company, events, venues' names, prices or statistics.
- If you do not know the city well, return fewer items. Never pad with guesses.`;

const SCHEMA = {
  type: 'object',
  properties: {
    alias: { type: 'string' },
    areas: { type: 'array', items: { type: 'string' } },
    venues: { type: 'array', items: { type: 'string' } },
    nearby: { type: 'array', items: { type: 'string' } },
    lat: { type: 'number' },
    lng: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['alias', 'areas', 'venues', 'nearby', 'lat', 'lng', 'notes'],
  additionalProperties: false,
} as const;

const isEmptyList = (v: any) => !Array.isArray(v) || v.length === 0;
const cleanList = (v: any[], max: number, maxLen = 60) => Array.from(new Set((v || []).map((x) => String(x).trim()).filter((x) => x && x.length <= maxLen))).slice(0, max);

export type FillResult = { id: string; city: string; filled: string[]; source: 'hand-written' | 'ai' | 'none'; note?: string };

export async function fillCityProfile(db: SupabaseClient, row: any, opts: { useAi?: boolean } = {}): Promise<FillResult> {
  const filled: string[] = [];
  const patch: Record<string, any> = {};
  const hand = CITIES.find((c) => c.slug === row.slug);

  const need = {
    alias: !row.alias,
    areas: isEmptyList(row.areas),
    venues: isEmptyList(row.venues),
    nearby: isEmptyList(row.nearby),
    geo: row.geo_lat == null || row.geo_lng == null,
    notes: !row.local_notes,
  };
  if (!Object.values(need).some(Boolean)) return { id: row.id, city: row.city, filled, source: 'none', note: 'Already complete' };

  if (hand) {
    if (need.alias && hand.alias) { patch.alias = hand.alias; filled.push('nickname'); }
    if (need.areas) { patch.areas = hand.areas; filled.push('areas'); }
    if (need.venues) { patch.venues = hand.venues; filled.push('venues'); }
    if (need.nearby && hand.nearby?.length) { patch.nearby = hand.nearby; filled.push('nearby towns'); }
    if (need.geo) { patch.geo_lat = hand.geo.lat; patch.geo_lng = hand.geo.lng; filled.push('coordinates'); }
    if (Object.keys(patch).length) await db.from('locations').update(patch).eq('id', row.id);
    return { id: row.id, city: row.city, filled, source: 'hand-written' };
  }

  if (opts.useAi === false || !process.env.ANTHROPIC_API_KEY) return { id: row.id, city: row.city, filled, source: 'none', note: 'ANTHROPIC_API_KEY is not set' };

  const client = new Anthropic();
  const res: any = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as any } } as any,
    messages: [{ role: 'user', content: `City: ${row.city}${row.state ? `, ${row.state}` : ''}, India.` }],
  } as any);
  const block = res.content.find((b: any) => b.type === 'text');
  if (!block) throw new Error('Claude returned no text');
  const g = JSON.parse(block.text);

  const areas = cleanList(g.areas, 14);
  const venues = cleanList(g.venues, 6, 90);
  const nearby = cleanList(g.nearby, 5);
  if (need.alias && g.alias && g.alias.trim().toLowerCase() !== String(row.city).toLowerCase() && g.alias.length < 30) { patch.alias = g.alias.trim(); filled.push('nickname'); }
  if (need.areas && areas.length >= 4) { patch.areas = areas; filled.push('areas'); }
  if (need.venues && venues.length >= 3) { patch.venues = venues; filled.push('venues'); }
  if (need.nearby && nearby.length >= 2) { patch.nearby = nearby; filled.push('nearby towns'); }
  // coordinates must be inside India, otherwise they are dropped (a wrong pin is worse than none)
  if (need.geo && g.lat >= 6 && g.lat <= 37.5 && g.lng >= 68 && g.lng <= 98) { patch.geo_lat = Math.round(g.lat * 10000) / 10000; patch.geo_lng = Math.round(g.lng * 10000) / 10000; filled.push('coordinates'); }
  if (need.notes && g.notes && g.notes.length > 20 && g.notes.length < 400) { patch.local_notes = g.notes.trim(); filled.push('local notes'); }

  if (Object.keys(patch).length) {
    const { error } = await db.from('locations').update(patch).eq('id', row.id);
    if (error) throw error;
  }
  return { id: row.id, city: row.city, filled, source: 'ai', note: filled.length ? 'Filled by AI: please read it once and correct anything wrong.' : 'The AI was not confident enough to fill anything.' };
}

/** Every city that still has an empty profile field. */
export async function fillAllCityProfiles(db: SupabaseClient, opts: { useAi?: boolean } = {}) {
  const { data } = await db.from('locations').select('*');
  const out: FillResult[] = [];
  for (const row of (data as any[]) || []) {
    try { out.push(await fillCityProfile(db, row, opts)); } catch (e: any) { out.push({ id: row.id, city: row.city, filled: [], source: 'none', note: String(e?.message || e).slice(0, 120) }); }
  }
  return out;
}
