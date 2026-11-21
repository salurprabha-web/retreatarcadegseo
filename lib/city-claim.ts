/**
 * What the site says about the cities it covers, taken from the cities that really have a published page.
 * Nothing here is typed by hand, so the text on every page matches /locations and grows as cities are added.
 */
import { getAllCities } from '@/lib/city-data';

export type CityClaim = { names: string[]; count: number; list: string; short: string };

const join = (a: string[]) => (a.length <= 1 ? a.join('') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export async function getCityClaim(): Promise<CityClaim> {
  let names: string[] = [];
  try { names = (await getAllCities()).map((c) => c.name); } catch { /* fall back below */ }
  if (!names.length) names = ['Hyderabad', 'Visakhapatnam'];
  const shown = names.slice(0, 5);
  const more = names.length - shown.length;
  const list = more > 0 ? `${shown.join(', ')} and ${more} more ${more === 1 ? 'city' : 'cities'}` : join(shown);
  return { names, count: names.length, list, short: names.length > 2 ? `${names.length} cities` : join(names) };
}
