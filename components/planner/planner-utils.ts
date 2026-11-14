export type Kind = 'booth' | 'mirror' | 'vr' | 'arcade' | 'claw' | 'hoop' | 'ai' | 'table' | 'crate';
export type Venue = 'indoor' | 'outdoor';

export type Station = {
  uid: string;
  productId: string;
  title: string;
  kind: Kind;
  x: number;
  z: number;
  /** rotation around the vertical axis, radians */
  rot: number;
};

export const KIND_COLOR: Record<Kind, string> = {
  booth: '#f472b6',
  mirror: '#e879f9',
  vr: '#8b5cf6',
  arcade: '#fb923c',
  claw: '#34d399',
  hoop: '#f97316',
  ai: '#22d3ee',
  table: '#facc15',
  crate: '#94a3b8',
};

export const KIND_LABEL: Record<Kind, string> = {
  booth: 'Photo booth',
  mirror: 'Mirror booth',
  vr: 'VR zone',
  arcade: 'Arcade',
  claw: 'Claw / prize',
  hoop: 'Sports game',
  ai: 'AI experience',
  table: 'Game station',
  crate: 'Activity',
};

/** Floor footprint radius (metres) used for spacing and collision. */
export const KIND_RADIUS: Record<Kind, number> = {
  booth: 1.7,
  mirror: 1.4,
  vr: 1.6,
  arcade: 1.2,
  claw: 1.1,
  hoop: 1.7,
  ai: 1.2,
  table: 1.6,
  crate: 1.3,
};

export function kindOf(title: string, category?: string | null): Kind {
  const t = `${title} ${category || ''}`.toLowerCase();
  if (/mirror/.test(t)) return 'mirror';
  if (/claw|prize|crane/.test(t)) return 'claw';
  if (/basketball|hoop|shoot|cricket|football|penalty|archery|baton|slingshot|toss/.test(t)) return 'hoop';
  if (/photo|booth|selfie|360|gif|print|snap/.test(t)) return 'booth';
  if (/\bvr\b|virtual|simulator|metaverse|\bar\b|hologram/.test(t)) return 'vr';
  if (/\bai\b|artificial|robot|caricature|face|digital art/.test(t)) return 'ai';
  if (/arcade|cabinet|racing|pinball|retro|video game|console|gaming/.test(t)) return 'arcade';
  if (/foosball|table|hockey|carrom|pool|jenga|dart|bowling|game|quiz|puzzle|mosaic|spin|wheel|touch|ring|activity/.test(t))
    return 'table';
  return 'crate';
}

export function floorSide(guests: number) {
  return Math.min(28, 10 + Math.sqrt(guests) * 0.6);
}

/** Walkable area for stations (stage at the back, seating along the sides). */
export function bounds(side: number) {
  const hw = side / 2 - 2.8;
  return { hw, zMin: -side / 2 + 5.8, zMax: side / 2 - 2.2 };
}

export const GUESTS_PER_DOT = 4;

export function clampToFloor(x: number, z: number, side: number) {
  const b = bounds(side);
  return {
    x: Math.max(-b.hw, Math.min(b.hw, x)),
    z: Math.max(b.zMin, Math.min(b.zMax, z)),
  };
}

/** Evenly spaced rows across the floor, starting near the stage and filling towards the entrance. */
export function autoLayout(kinds: Kind[], side: number) {
  const b = bounds(side);
  const gap = 4.8;
  const cols = Math.max(1, Math.floor((b.hw * 2) / gap) + 1);
  return kinds.map((_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, kinds.length - row * cols);
    const col = i % cols;
    const x = (col - (inRow - 1) / 2) * gap + (row % 2 ? gap * 0.18 : 0);
    const z = b.zMin + 1.4 + row * gap * 0.9;
    return clampToFloor(x, z, side);
  });
}

/** Push a point out of the footprints of other stations. */
export function resolveCollisions(
  x: number,
  z: number,
  kind: Kind,
  others: { x: number; z: number; kind: Kind }[],
  side: number
) {
  let px = x;
  let pz = z;
  for (let pass = 0; pass < 3; pass++) {
    for (const o of others) {
      const min = KIND_RADIUS[kind] + KIND_RADIUS[o.kind] - 0.4;
      const dx = px - o.x;
      const dz = pz - o.z;
      const d = Math.hypot(dx, dz);
      if (d < min) {
        const nx = d < 0.001 ? 1 : dx / d;
        const nz = d < 0.001 ? 0 : dz / d;
        px = o.x + nx * min;
        pz = o.z + nz * min;
      }
    }
    const c = clampToFloor(px, pz, side);
    px = c.x;
    pz = c.z;
  }
  return { x: px, z: pz };
}

/** A sensible first set of experiences for each event type (picked from the real catalogue). */
export const TEMPLATES: Record<string, { guests: number; recipe: Kind[]; blurb: string }> = {
  'Corporate event': { guests: 200, recipe: ['booth', 'vr', 'arcade', 'ai', 'hoop'], blurb: 'Brand-friendly mix that keeps teams mingling.' },
  'Wedding / Sangeet': { guests: 300, recipe: ['booth', 'mirror', 'ai', 'table'], blurb: 'Photo-first setup guests of every age enjoy.' },
  'College fest': { guests: 600, recipe: ['arcade', 'vr', 'hoop', 'claw', 'table', 'booth'], blurb: 'High-energy zones that handle big crowds.' },
  'Brand activation': { guests: 400, recipe: ['booth', 'vr', 'ai', 'arcade', 'mirror'], blurb: 'Shareable moments that carry your brand.' },
  'Family / Birthday': { guests: 80, recipe: ['claw', 'table', 'hoop', 'booth'], blurb: 'Easy, safe fun from kids to grandparents.' },
  Exhibition: { guests: 500, recipe: ['vr', 'ai', 'booth', 'arcade'], blurb: 'Crowd magnets that bring footfall to your stall.' },
};

/* ───────── shareable plans (URL-safe, no server needed) ───────── */

export type SharedPlan = {
  t: string;
  g: number;
  c: string;
  v: Venue;
  s: [string, number, number, number][];
};

export function encodePlan(p: SharedPlan) {
  const json = JSON.stringify(p);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePlan(raw: string): SharedPlan | null {
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))));
    const p = JSON.parse(json);
    if (!p || typeof p.g !== 'number' || !Array.isArray(p.s)) return null;
    return {
      t: String(p.t || ''),
      g: Math.max(20, Math.min(1000, Math.round(p.g))),
      c: String(p.c || '').slice(0, 60),
      v: p.v === 'outdoor' ? 'outdoor' : 'indoor',
      s: p.s
        .filter((r: any) => Array.isArray(r) && typeof r[0] === 'string')
        .slice(0, 40)
        .map((r: any) => [r[0], Number(r[1]) || 0, Number(r[2]) || 0, Number(r[3]) || 0]),
    };
  } catch {
    return null;
  }
}
