/**
 * Which service's page is THE page for a product in a city.
 * Pure function (no database), shared by the product page, the sitemap, the generator and the city hub,
 * so all of them always agree.
 *
 * Best match first: the service whose name shares the most meaningful words with the product's name.
 * Ties: lower display_order, then the shorter service name, then alphabetical.
 */
export type PrimaryCand = { id?: string; slug: string; title: string; display_order?: number | null };

const STOP = new Set([
  'rental', 'rentals', 'rent', 'hire', 'for', 'and', 'the', 'in', 'of', 'a', 'an', 'with', 'to', 'more',
  'service', 'services', 'activity', 'activities', 'solution', 'solutions', 'event', 'events', 'corporate',
  'experience', 'experiences', 'engagement', 'entertainment',
]);

export function tokens(s: string): Set<string> {
  const t = String(s || '')
    .toLowerCase()
    .replace(/photobooth/g, 'photo booth')
    .replace(/photo-booth/g, 'photo booth')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .filter((w) => !STOP.has(w));
  return new Set(t);
}

const CITY_WORDS = ['hyderabad', 'bangalore', 'bengaluru', 'chennai', 'mumbai', 'pune', 'delhi', 'kolkata', 'visakhapatnam', 'vizag', 'ahmedabad', 'jaipur', 'kochi', 'coimbatore'];
const SAME_CITY: Record<string, string[]> = { visakhapatnam: ['vizag'], vizag: ['visakhapatnam'], bangalore: ['bengaluru'], bengaluru: ['bangalore'] };

/**
 * cityName: the city of the page. A service whose name or address mentions a DIFFERENT city
 * (e.g. "...-rental-hyderabad" on a Vizag page) is not picked while any other choice exists.
 */
export function choosePrimary<T extends PrimaryCand>(cands: T[], productTitle: string, cityName?: string): T | null {
  if (!cands.length) return null;
  const pt = tokens(productTitle);
  const here = String(cityName || '').toLowerCase();
  const okWords = new Set([here, ...(SAME_CITY[here] || [])]);
  const wrongCity = (c: T) => {
    const t = (c.title + ' ' + c.slug).toLowerCase();
    return CITY_WORDS.some((w) => !okWords.has(w) && t.includes(w));
  };
  const score = (c: T) => {
    let n = 0;
    tokens(c.title).forEach((w) => pt.has(w) && n++);
    return n - (here && wrongCity(c) ? 50 : 0);
  };
  return [...cands].sort(
    (a, b) =>
      score(b) - score(a) ||
      (a.display_order ?? 9999) - (b.display_order ?? 9999) ||
      a.title.length - b.title.length ||
      a.slug.localeCompare(b.slug)
  )[0];
}
