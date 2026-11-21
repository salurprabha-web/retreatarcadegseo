/**
 * DataForSEO (search volumes). Server only.
 * Switches on when DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set in Vercel (the API login and API
 * password from dataforseo.com > API Access, NOT the account password).
 */
export function dataForSeoConfigured() {
  return !!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD;
}

export type VolumeRow = { keyword: string; volume: number | null; competition: number | null; cpc: number | null };

/** Google Ads only accepts real search-sized phrases: up to 80 characters, 10 words, no symbols. Anything else is never sent. */
export function askable(k: string) {
  const t = String(k || '').trim();
  return t.length > 0 && t.length <= 80 && t.split(/\s+/).length <= 10 && /^[\p{L}\p{N} '.\-]+$/u.test(t);
}

export async function fetchSearchVolumes(keywords: string[]): Promise<VolumeRow[]> {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const out: VolumeRow[] = [];

  /** One request. Returns null when DataForSEO rejected the group because of a phrase in it (so the caller can split it). */
  async function ask(batch: string[]): Promise<VolumeRow[] | null> {
    const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      // 2356 = India, English
      body: JSON.stringify([{ location_code: 2356, language_code: 'en', keywords: batch }]),
    });
    if (!res.ok) throw new Error(`DataForSEO answered ${res.status}. Check the login, password and balance.`);
    const json: any = await res.json();
    const task = json?.tasks?.[0];
    if (!task || (task.status_code && task.status_code >= 40000)) {
      // 40501 = a field (a phrase) was not accepted: split the group instead of failing everything
      if (task && /invalid field|keyword/i.test(String(task.status_message || ''))) return null;
      throw new Error(task?.status_message || 'DataForSEO returned an error');
    }
    return (task.result || []).map((r: any) => ({
      keyword: String(r.keyword || ''),
      volume: typeof r.search_volume === 'number' ? r.search_volume : null,
      competition: typeof r.competition_index === 'number' ? r.competition_index : null,
      cpc: typeof r.cpc === 'number' ? r.cpc : null,
    }));
  }

  async function safe(batch: string[]) {
    if (!batch.length) return;
    const r = await ask(batch);
    if (r) { out.push(...r); return; }
    if (batch.length === 1) return; // this one phrase is refused: it simply gets no number
    const mid = Math.ceil(batch.length / 2);
    await safe(batch.slice(0, mid));
    await safe(batch.slice(mid));
  }

  const good = keywords.filter(askable);
  // up to 700 phrases per request keeps each call small and cheap to retry
  for (let i = 0; i < good.length; i += 700) await safe(good.slice(i, i + 700));
  return out;
}

export type SerpTitle = { title: string; domain: string };

/** The titles Google shows on page one for a phrase in India (our own site is left out). One live request, a fraction of a cent. */
export async function fetchTopTitles(keyword: string): Promise<SerpTitle[]> {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keyword, location_code: 2356, language_code: 'en', depth: 10 }]),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`DataForSEO answered ${res.status}`);
  const json: any = await res.json();
  const task = json?.tasks?.[0];
  if (!task || (task.status_code && task.status_code >= 40000)) throw new Error(task?.status_message || 'DataForSEO returned an error');
  const items: any[] = task.result?.[0]?.items || [];
  return items
    .filter((i) => i.type === 'organic' && i.title && !String(i.domain || '').includes('retreatarcade'))
    .slice(0, 6)
    .map((i) => ({ title: String(i.title), domain: String(i.domain || '') }));
}

export type SerpInsights = { titles: SerpTitle[]; questions: string[]; related: string[] };

/** Page-one titles, the questions people also ask, and related searches for a phrase in India. One live request. */
export async function fetchSerpInsights(keyword: string): Promise<SerpInsights> {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keyword, location_code: 2356, language_code: 'en', depth: 10 }]),
    signal: AbortSignal.timeout(14000),
  });
  if (!res.ok) throw new Error(`DataForSEO answered ${res.status}`);
  const json: any = await res.json();
  const task = json?.tasks?.[0];
  if (!task || (task.status_code && task.status_code >= 40000)) throw new Error(task?.status_message || 'DataForSEO returned an error');
  const items: any[] = task.result?.[0]?.items || [];
  const titles = items.filter((i) => i.type === 'organic' && i.title && !String(i.domain || '').includes('retreatarcade')).slice(0, 6).map((i) => ({ title: String(i.title), domain: String(i.domain || '') }));
  const questions: string[] = [];
  items.filter((i) => i.type === 'people_also_ask').forEach((p) => (p.items || []).forEach((q: any) => q?.title && questions.push(String(q.title))));
  const related: string[] = [];
  items.filter((i) => i.type === 'related_searches').forEach((r) => (r.items || []).forEach((q: any) => related.push(typeof q === 'string' ? q : String(q?.title || ''))));
  return { titles, questions: Array.from(new Set(questions)).slice(0, 8), related: Array.from(new Set(related.filter(Boolean))).slice(0, 8) };
}

/** Where retreatarcade.in appears in Google India for a phrase (top 30). position is null when it is not in the top 30. */
export async function fetchRank(keyword: string): Promise<{ position: number | null; url: string | null }> {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keyword, location_code: 2356, language_code: 'en', depth: 30 }]),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DataForSEO answered ${res.status}`);
  const json: any = await res.json();
  const task = json?.tasks?.[0];
  if (!task || (task.status_code && task.status_code >= 40000)) throw new Error(task?.status_message || 'DataForSEO returned an error');
  const items: any[] = task.result?.[0]?.items || [];
  const hit = items.find((i) => i.type === 'organic' && /(^|\.)retreatarcade\.in$/i.test(String(i.domain || '')));
  return hit ? { position: Number(hit.rank_group) || null, url: String(hit.url || '') || null } : { position: null, url: null };
}
