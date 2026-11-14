export type Kind = 'booth' | 'vr' | 'arcade' | 'ai' | 'game' | 'crate';

export type Station = {
  uid: string;
  title: string;
  kind: Kind;
  x: number;
  z: number;
};

export const KIND_COLOR: Record<Kind, string> = {
  booth: '#f472b6',
  vr: '#8b5cf6',
  arcade: '#fb923c',
  ai: '#22d3ee',
  game: '#facc15',
  crate: '#94a3b8',
};

export function kindOf(title: string, category?: string | null): Kind {
  const t = `${title} ${category || ''}`.toLowerCase();
  if (/photo|booth|selfie|mirror|360|gif/.test(t)) return 'booth';
  if (/\bvr\b|virtual|simulator/.test(t)) return 'vr';
  if (/\bai\b|artificial|robot/.test(t)) return 'ai';
  if (/arcade|claw|cabinet|racing|basketball/.test(t)) return 'arcade';
  if (/game|quiz|dart|cricket|football|bowling/.test(t)) return 'game';
  return 'crate';
}

export function floorSide(guests: number) {
  return Math.min(26, 9 + Math.sqrt(guests) * 0.55);
}

export const GUESTS_PER_DOT = 4;
