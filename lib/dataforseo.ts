/**
 * DataForSEO (search volumes). Server only.
 * Switches on when DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are set in Vercel (the API login and API
 * password from dataforseo.com > API Access, NOT the account password).
 */
export function dataForSeoConfigured() {
  return !!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD;
}

export type VolumeRow = { keyword: string; volume: number | null; competition: number | null; cpc: number | null };

export async function fetchSearchVolumes(keywords: string[]): Promise<VolumeRow[]> {
  if (!dataForSeoConfigured()) throw new Error('DATAFORSEO_NOT_SET');
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const out: VolumeRow[] = [];
  // up to 700 phrases per request keeps each call small and cheap to retry
  for (let i = 0; i < keywords.length; i += 700) {
    const batch = keywords.slice(i, i + 700);
    const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      // 2356 = India, English
      body: JSON.stringify([{ location_code: 2356, language_code: 'en', keywords: batch }]),
    });
    if (!res.ok) throw new Error(`DataForSEO answered ${res.status}. Check the login, password and balance.`);
    const json: any = await res.json();
    const task = json?.tasks?.[0];
    if (!task || (task.status_code && task.status_code >= 40000)) throw new Error(task?.status_message || 'DataForSEO returned an error');
    for (const r of task.result || []) {
      out.push({
        keyword: String(r.keyword || ''),
        volume: typeof r.search_volume === 'number' ? r.search_volume : null,
        competition: typeof r.competition_index === 'number' ? r.competition_index : null,
        cpc: typeof r.cpc === 'number' ? r.cpc : null,
      });
    }
  }
  return out;
}
