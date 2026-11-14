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

/* ───────── customisable venue ───────── */

export type Floor = 'dark' | 'wood' | 'carpet' | 'marble';
export type StageSide = 'none' | 'back' | 'left' | 'right';
export type SeatStyle = 'none' | 'tables' | 'theatre' | 'lounge';
export type LightTheme = 'neon' | 'warm' | 'cool' | 'rgb' | 'white';
export type WallColor = 'midnight' | 'ivory' | 'charcoal' | 'burgundy' | 'emerald' | 'royal';
export type EntranceStyle = 'neon' | 'floral' | 'balloon';
export type CarpetStyle = 'none' | 'neon' | 'red';
export type TimeOfDay = 'day' | 'dusk' | 'night';

export type VenueConfig = {
  venue: Venue;
  /** true: floor is sized from the guest count; false: custom width x length */
  auto: boolean;
  w: number;
  l: number;
  stage: StageSide;
  stageSize: 'S' | 'M' | 'L';
  /** catwalk extending from the main stage into the room */
  runway: boolean;
  /** small second stage on a side wall */
  stage2: 'none' | 'left' | 'right';
  /** seats around each banquet table */
  tableSeats: 4 | 6 | 8 | 10;
  seating: SeatStyle;
  /** share of guests who get a seat, 10-100 */
  seatPct: number;
  theme: LightTheme;
  /** light level, 0.5-1.5 */
  bright: number;
  beams: boolean;
  floor: Floor;
  dance: boolean;
  bar: boolean;
  photoWall: boolean;
  screens: boolean;
  wall: WallColor;
  entrance: EntranceStyle;
  carpet: CarpetStyle;
  fairy: boolean;
  balloons: boolean;
  welcome: boolean;
  /** extra services to include in the quote (see SERVICES) */
  services: string[];
  time: TimeOfDay;
  /** shown on the stage screen */
  title: string;
  subtitle: string;
};

export const DEFAULT_CFG: VenueConfig = {
  venue: 'indoor',
  auto: true,
  w: 16,
  l: 16,
  stage: 'back',
  stageSize: 'M',
  runway: false,
  stage2: 'none',
  tableSeats: 4,
  seating: 'tables',
  seatPct: 40,
  theme: 'neon',
  bright: 1,
  beams: true,
  floor: 'dark',
  dance: false,
  bar: false,
  photoWall: false,
  screens: true,
  wall: 'midnight',
  entrance: 'neon',
  carpet: 'neon',
  fairy: false,
  balloons: false,
  welcome: false,
  services: [],
  time: 'night',
  title: '',
  subtitle: '',
};

export const THEMES: Record<LightTheme, { name: string; colors: [string, string, string, string]; swatch: string }> = {
  neon: { name: 'Neon arcade', colors: ['#8b5cf6', '#fb923c', '#22d3ee', '#f472b6'], swatch: 'linear-gradient(135deg,#8b5cf6,#fb923c)' },
  warm: { name: 'Warm gold', colors: ['#f59e0b', '#fb923c', '#fde68a', '#f97316'], swatch: 'linear-gradient(135deg,#f59e0b,#fde68a)' },
  cool: { name: 'Cool ice', colors: ['#38bdf8', '#818cf8', '#67e8f9', '#a5b4fc'], swatch: 'linear-gradient(135deg,#38bdf8,#a5b4fc)' },
  rgb: { name: 'Party RGB', colors: ['#ef4444', '#22c55e', '#3b82f6', '#eab308'], swatch: 'linear-gradient(135deg,#ef4444,#22c55e,#3b82f6)' },
  white: { name: 'Clean white', colors: ['#e2e8f0', '#f8fafc', '#cbd5e1', '#ffffff'], swatch: 'linear-gradient(135deg,#e2e8f0,#ffffff)' },
};

export const WALL_COLORS: Record<WallColor, { name: string; hex: string }> = {
  midnight: { name: 'Midnight', hex: '#0d1235' },
  ivory: { name: 'Ivory', hex: '#d9d2c3' },
  charcoal: { name: 'Charcoal', hex: '#1b1c22' },
  burgundy: { name: 'Burgundy', hex: '#3b0d1c' },
  emerald: { name: 'Emerald', hex: '#0d2b22' },
  royal: { name: 'Royal blue', hex: '#14275a' },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function dims(cfg: VenueConfig, guests: number) {
  if (cfg.auto) {
    const s = floorSide(guests);
    return { w: s, l: s };
  }
  return { w: clamp(cfg.w, 10, 60), l: clamp(cfg.l, 10, 70) };
}

export const STAGE_W = { S: 6, M: 10, L: 14 } as const;
export const STAGE_D = { S: 3, M: 4, L: 5 } as const;

export type StageRect = { cx: number; cz: number; sw: number; sd: number; rot: number };

export function stageRect(cfg: VenueConfig, w: number, l: number): StageRect | null {
  if (cfg.stage === 'none') return null;
  const sd = STAGE_D[cfg.stageSize];
  if (cfg.stage === 'back') return { cx: 0, cz: -l / 2 + sd / 2, sw: Math.min(STAGE_W[cfg.stageSize], w - 3), sd, rot: 0 };
  if (cfg.stage === 'left') return { cx: -w / 2 + sd / 2, cz: 0, sw: Math.min(STAGE_W[cfg.stageSize], l - 6), sd, rot: Math.PI / 2 };
  return { cx: w / 2 - sd / 2, cz: 0, sw: Math.min(STAGE_W[cfg.stageSize], l - 6), sd, rot: -Math.PI / 2 };
}

export const RUNWAY_LEN = 6.5;

/** Small second stage on a side wall (never on the same wall as the main stage). */
export function stage2Rect(cfg: VenueConfig, w: number, l: number): StageRect | null {
  if (cfg.stage2 === 'none' || cfg.stage2 === cfg.stage) return null;
  const sd = 3;
  const sw = Math.min(6, l - 6);
  return cfg.stage2 === 'left'
    ? { cx: -w / 2 + sd / 2, cz: 0, sw, sd, rot: Math.PI / 2 }
    : { cx: w / 2 - sd / 2, cz: 0, sw, sd, rot: -Math.PI / 2 };
}

export type Bounds = { x0: number; x1: number; z0: number; z1: number };

export function seatCount(cfg: VenueConfig, guests: number) {
  return cfg.seating === 'none' ? 0 : Math.max(0, Math.round((guests * cfg.seatPct) / 100));
}

/** Rows of chairs facing the stage (or the back wall when there is no stage). */
export function theatreSeats(cfg: VenueConfig, w: number, l: number, guests: number) {
  if (cfg.seating !== 'theatre') return { chairs: [] as { x: number; z: number; rot: number }[], depth: 0 };
  const total = Math.min(260, seatCount(cfg, guests));
  const stage = stageRect(cfg, w, l);
  const axisLen = cfg.stage === 'left' || cfg.stage === 'right' ? l : w; // width of the block across the room
  const cols = Math.max(4, Math.min(22, Math.floor((axisLen - 5) / 0.7)));
  const rows = Math.max(1, Math.ceil(total / cols));
  const start = (stage ? stage.sd : 0) + 1.6 + (cfg.dance ? 6.4 : 0) + (cfg.runway && stage ? RUNWAY_LEN : 0);
  const chairs: { x: number; z: number; rot: number }[] = [];
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, total - r * cols);
    const c = i % cols;
    const across = (c - (inRow - 1) / 2) * 0.7;
    const along = start + r * 0.85;
    if (cfg.stage === 'left') chairs.push({ x: -w / 2 + along, z: across, rot: Math.PI / 2 });
    else if (cfg.stage === 'right') chairs.push({ x: w / 2 - along, z: across, rot: -Math.PI / 2 });
    else chairs.push({ x: across, z: -l / 2 + along, rot: 0 });
  }
  return { chairs, depth: rows * 0.85 + 0.8 };
}

/** The part of the floor where attractions can be placed. */
export function walkBounds(cfg: VenueConfig, w: number, l: number, guests: number): Bounds {
  const sideBand = cfg.seating === 'tables' || cfg.seating === 'lounge' ? 2.8 : 1.6;
  let x0 = -w / 2 + sideBand + (cfg.bar ? 1.6 : 0);
  let x1 = w / 2 - sideBand - (cfg.photoWall ? 1.2 : 0);
  let z0 = -l / 2 + 1.6;
  const z1 = l / 2 - 2.2 - (cfg.photoWall || cfg.welcome ? 0.6 : 0);
  const stage = stageRect(cfg, w, l);
  const reserve = (stage ? stage.sd + 1.8 : 1.6) + (cfg.dance ? 6.4 : 0) + (cfg.runway && stage ? RUNWAY_LEN : 0) + theatreSeats(cfg, w, l, guests).depth;
  const st2 = stage2Rect(cfg, w, l);
  if (st2) {
    if (cfg.stage2 === 'left') x0 = Math.max(x0, -w / 2 + st2.sd + 1.8);
    else x1 = Math.min(x1, w / 2 - st2.sd - 1.8);
  }
  if (cfg.stage === 'left') x0 = Math.max(x0, -w / 2 + reserve);
  else if (cfg.stage === 'right') x1 = Math.min(x1, w / 2 - reserve);
  else z0 = -l / 2 + reserve;
  // never let the usable floor collapse
  if (x1 - x0 < 4) {
    const m = (x0 + x1) / 2;
    x0 = m - 2;
    x1 = m + 2;
  }
  if (z1 - z0 < 4) z0 = z1 - 4;
  return { x0, x1, z0, z1 };
}

export const GUESTS_PER_DOT = 4;

export function clampToFloor(x: number, z: number, b: Bounds) {
  return { x: clamp(x, b.x0, b.x1), z: clamp(z, b.z0, b.z1) };
}

/** Evenly spaced rows across the usable floor, starting near the stage and filling towards the entrance. */
export function autoLayout(kinds: Kind[], b: Bounds) {
  const gap = 4.8;
  const width = b.x1 - b.x0;
  const cols = Math.max(1, Math.floor(width / gap) + 1);
  const cx = (b.x0 + b.x1) / 2;
  return kinds.map((_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, kinds.length - row * cols);
    const col = i % cols;
    const x = cx + (col - (inRow - 1) / 2) * gap + (row % 2 ? gap * 0.18 : 0);
    const z = b.z0 + 1.4 + row * gap * 0.9;
    return clampToFloor(x, z, b);
  });
}

/** Push a point out of the footprints of other stations. */
export function resolveCollisions(
  x: number,
  z: number,
  kind: Kind,
  others: { x: number; z: number; kind: Kind }[],
  b: Bounds
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
    const c = clampToFloor(px, pz, b);
    px = c.x;
    pz = c.z;
  }
  return { x: px, z: pz };
}

/** Merge a saved/shared config over the defaults, keeping every value in range. */
export function sanitizeCfg(o: Partial<VenueConfig> | undefined, venue: Venue): VenueConfig {
  const c: VenueConfig = { ...DEFAULT_CFG, venue };
  if (!o) return c;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => (allowed.includes(v as T) ? (v as T) : d);
  c.auto = o.auto !== false;
  c.w = clamp(Number(o.w) || DEFAULT_CFG.w, 10, 60);
  c.l = clamp(Number(o.l) || DEFAULT_CFG.l, 10, 70);
  c.stage = pick(o.stage, ['none', 'back', 'left', 'right'] as const, 'back');
  c.stageSize = pick(o.stageSize, ['S', 'M', 'L'] as const, 'M');
  c.runway = !!o.runway;
  c.stage2 = pick(o.stage2, ['none', 'left', 'right'] as const, 'none');
  c.tableSeats = ([4, 6, 8, 10] as const).includes(o.tableSeats as 4) ? (o.tableSeats as 4 | 6 | 8 | 10) : 4;
  c.seating = pick(o.seating, ['none', 'tables', 'theatre', 'lounge'] as const, 'tables');
  c.seatPct = clamp(Number(o.seatPct) || 40, 10, 100);
  c.theme = pick(o.theme, ['neon', 'warm', 'cool', 'rgb', 'white'] as const, 'neon');
  c.bright = clamp(Number(o.bright) || 1, 0.5, 1.5);
  c.beams = o.beams !== false;
  c.floor = pick(o.floor, ['dark', 'wood', 'carpet', 'marble'] as const, 'dark');
  c.dance = !!o.dance;
  c.bar = !!o.bar;
  c.photoWall = !!o.photoWall;
  c.screens = o.screens !== false;
  c.wall = pick(o.wall, ['midnight', 'ivory', 'charcoal', 'burgundy', 'emerald', 'royal'] as const, 'midnight');
  c.entrance = pick(o.entrance, ['neon', 'floral', 'balloon'] as const, 'neon');
  c.carpet = pick(o.carpet, ['none', 'neon', 'red'] as const, 'neon');
  c.fairy = !!o.fairy;
  c.balloons = !!o.balloons;
  c.welcome = !!o.welcome;
  c.services = Array.isArray(o.services) ? o.services.filter((x) => SERVICES.some((y) => y.id === x)).slice(0, 20) : [];
  c.time = pick(o.time, ['day', 'dusk', 'night'] as const, 'night');
  c.title = String(o.title || '').slice(0, 44);
  c.subtitle = String(o.subtitle || '').slice(0, 60);
  return c;
}

export const SERVICES: { id: string; name: string; hint: string }[] = [
  { id: 'catering', name: 'Catering & buffet', hint: 'Food counters, live stations, beverages' },
  { id: 'sound', name: 'Sound system', hint: 'PA, mics and speakers for the hall' },
  { id: 'dj', name: 'DJ & music', hint: 'DJ with console and playlist planning' },
  { id: 'emcee', name: 'Emcee / anchor', hint: 'Host to run the programme' },
  { id: 'lighting', name: 'Extra stage lighting', hint: 'Moving heads, truss and effects' },
  { id: 'decor', name: 'Decor & florals', hint: 'Backdrops, centrepieces, themes' },
  { id: 'vip', name: 'VIP area', hint: 'Reserved lounge with separate service' },
  { id: 'branding', name: 'Branding & printing', hint: 'Banners, standees, custom screens' },
  { id: 'staff', name: 'Event staff & security', hint: 'Ushers, registration, crowd control' },
  { id: 'power', name: 'Power backup', hint: 'Generator and distribution' },
];

export type Preset = { id: string; name: string; blurb: string; type: string; guests: number; cfg: Partial<VenueConfig> };

export const PRESETS: Preset[] = [
  {
    id: 'wedding',
    name: 'Wedding reception',
    blurb: 'Ivory walls, floral entrance, red carpet, fairy lights',
    type: 'Wedding / Sangeet',
    guests: 300,
    cfg: { venue: 'indoor', stage: 'back', stageSize: 'L', seating: 'tables', seatPct: 70, theme: 'warm', floor: 'marble', wall: 'ivory', entrance: 'floral', carpet: 'red', fairy: true, dance: true, photoWall: true, welcome: true, bar: false, balloons: false, screens: true },
  },
  {
    id: 'gala',
    name: 'Corporate gala',
    blurb: 'Cool light, charcoal walls, welcome desk and bar',
    type: 'Corporate event',
    guests: 200,
    cfg: { venue: 'indoor', stage: 'back', stageSize: 'M', seating: 'tables', seatPct: 60, theme: 'cool', floor: 'dark', wall: 'charcoal', entrance: 'neon', carpet: 'neon', fairy: false, dance: false, photoWall: true, welcome: true, bar: true, balloons: false, screens: true },
  },
  {
    id: 'fest',
    name: 'College fest',
    blurb: 'Big stage, RGB lights, dance floor, standing crowd',
    type: 'College fest',
    guests: 600,
    cfg: { venue: 'indoor', stage: 'back', stageSize: 'L', seating: 'none', seatPct: 20, theme: 'rgb', floor: 'dark', wall: 'midnight', entrance: 'neon', carpet: 'none', fairy: false, dance: true, photoWall: false, welcome: false, bar: false, balloons: false, screens: true },
  },
  {
    id: 'kids',
    name: 'Kids party',
    blurb: 'Balloon arch, bright carpet, lounge sofas',
    type: 'Family / Birthday',
    guests: 80,
    cfg: { venue: 'indoor', stage: 'none', stageSize: 'S', seating: 'lounge', seatPct: 40, theme: 'rgb', floor: 'carpet', wall: 'royal', entrance: 'balloon', carpet: 'none', fairy: true, dance: false, photoWall: true, welcome: false, bar: false, balloons: true, screens: false },
  },
  {
    id: 'expo',
    name: 'Exhibition / expo',
    blurb: 'Clean white light, marble floor, welcome desk',
    type: 'Exhibition',
    guests: 500,
    cfg: { venue: 'indoor', stage: 'none', stageSize: 'S', seating: 'none', seatPct: 20, theme: 'white', floor: 'marble', wall: 'charcoal', entrance: 'neon', carpet: 'none', fairy: false, dance: false, photoWall: false, welcome: true, bar: false, balloons: false, screens: true },
  },
  {
    id: 'lawn',
    name: 'Open-air festival',
    blurb: 'Night lawn, big stage, dance floor, fairy lights',
    type: 'Brand activation',
    guests: 400,
    cfg: { venue: 'outdoor', stage: 'back', stageSize: 'L', seating: 'lounge', seatPct: 25, theme: 'rgb', time: 'night', entrance: 'balloon', carpet: 'none', fairy: true, dance: true, photoWall: true, welcome: false, bar: true, balloons: true, screens: false },
  },
];

/** Plain-English lines describing the venue, used in the review step and in the quote. */
export function describeVenue(cfg: VenueConfig, w: number, l: number, guests: number): string[] {
  const out: string[] = [];
  out.push(`${cfg.venue === 'indoor' ? 'Indoor hall' : 'Open-air lawn'}, ${Math.round(w)} m x ${Math.round(l)} m (${Math.round(w * l)} m2)`);
  out.push(cfg.stage === 'none' ? 'No stage' : `${{ S: 'Small', M: 'Medium', L: 'Large' }[cfg.stageSize]} stage on the ${cfg.stage === 'back' ? 'back wall' : cfg.stage + ' wall'}`);
  if (cfg.runway && cfg.stage !== 'none') out.push('Catwalk / runway from the stage');
  if (stage2Rect(cfg, w, l)) out.push(`Second stage on the ${cfg.stage2} wall`);
  out.push(
    cfg.seating === 'none'
      ? 'Standing event'
      : `${{ tables: `Banquet tables (${cfg.tableSeats} per table)`, theatre: 'Theatre rows', lounge: 'Lounge sofas' }[cfg.seating]} for ${seatCount(cfg, guests)} guests`
  );
  out.push(`${THEMES[cfg.theme].name} lighting${cfg.venue === 'indoor' ? `, ${WALL_COLORS[cfg.wall].name} walls, ${cfg.floor} floor` : ', ' + cfg.time + ' setting'}`);
  const extras = [
    cfg.dance && 'dance floor',
    cfg.bar && 'bar',
    cfg.photoWall && 'photo wall',
    cfg.welcome && 'welcome desk',
    cfg.fairy && 'fairy lights',
    cfg.balloons && 'balloons',
    cfg.screens && cfg.venue === 'indoor' && 'LED screens',
  ].filter(Boolean) as string[];
  if (extras.length) out.push('Extras: ' + extras.join(', '));
  if (cfg.services.length) out.push('Services: ' + cfg.services.map((id) => SERVICES.find((x) => x.id === id)?.name).filter(Boolean).join(', '));
  out.push(`${{ neon: 'Neon', floral: 'Floral', balloon: 'Balloon' }[cfg.entrance]} entrance${cfg.carpet === 'red' ? ' with red carpet' : ''}`);
  return out;
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
  o?: Partial<VenueConfig>;
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
      o: p.o && typeof p.o === 'object' ? p.o : undefined,
      s: p.s
        .filter((r: any) => Array.isArray(r) && typeof r[0] === 'string')
        .slice(0, 40)
        .map((r: any) => [r[0], Number(r[1]) || 0, Number(r[2]) || 0, Number(r[3]) || 0]),
    };
  } catch {
    return null;
  }
}
