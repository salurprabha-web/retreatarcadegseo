/**
 * Publishing slots for the blog queue. Pure functions, no database.
 * Slots are at 10:00 Indian time. 3 posts a week = Mon, Wed, Fri. 2 posts a week = Tue, Fri.
 */
export type Cadence = 2 | 3;

const IST_MS = 5.5 * 3600 * 1000;
const DAYS: Record<Cadence, number[]> = { 3: [1, 3, 5], 2: [2, 5] }; // 0 = Sunday

/** The first slot strictly after `afterMs` (milliseconds, UTC). */
export function nextSlot(afterMs: number, perWeek: Cadence): Date {
  const shifted = new Date(afterMs + IST_MS); // read it as Indian wall-clock time with the UTC getters
  for (let d = 0; d < 21; d++) {
    const cand = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + d, 10, 0, 0);
    const dow = new Date(cand).getUTCDay();
    if (DAYS[perWeek].includes(dow) && cand > afterMs + IST_MS) return new Date(cand - IST_MS);
  }
  return new Date(afterMs + 7 * 86400000);
}

export const slotLabel = (perWeek: Cadence) => (perWeek === 3 ? 'Mon, Wed, Fri at 10:00 AM IST' : 'Tue and Fri at 10:00 AM IST');
