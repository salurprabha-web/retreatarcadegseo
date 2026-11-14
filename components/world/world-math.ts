/**
 * Shared geometry of the arcade world. The 3D scene, the HUD and the
 * no-WebGL fallback all derive the camera / current zone from here, so they
 * always agree.
 */
export const ZONES = [
  { name: 'The Lobby', short: 'Lobby', z: 0 },
  { name: 'Games Floor', short: 'Games', z: -34 },
  { name: 'VR Zone', short: 'VR', z: -68 },
  { name: 'Photo Studio', short: 'Studio', z: -102 },
  { name: 'Party Stage', short: 'Stage', z: -136 },
] as const;

export type Route =
  | { kind: 'journey'; from: number; to: number }
  | { kind: 'orbit'; zone: number };

/** Each page of the site is a different journey through the same world. */
export function routeFor(path: string): Route {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return { kind: 'journey', from: 0, to: 4 };
  if (p === '/plan-your-event') return { kind: 'journey', from: 0, to: 0 };
  if (p === '/services') return { kind: 'journey', from: 1, to: 2 };
  if (p.startsWith('/services/')) return { kind: 'journey', from: 1, to: 3 };
  if (p === '/events') return { kind: 'journey', from: 1, to: 3 };
  if (p.startsWith('/events/')) return { kind: 'orbit', zone: 3 };
  if (p === '/blog') return { kind: 'journey', from: 0, to: 1 };
  if (p.startsWith('/blog/')) return { kind: 'journey', from: 0, to: 0 };
  if (p === '/about') return { kind: 'journey', from: 4, to: 0 };
  if (p === '/contact') return { kind: 'orbit', zone: 4 };
  if (p === '/gallery') return { kind: 'journey', from: 3, to: 4 };
  return { kind: 'journey', from: 0, to: 1 };
}

export type CamTarget = { pos: [number, number, number]; look: [number, number, number]; z: number };

export function cameraFor(route: Route, p: number, t = 0): CamTarget {
  if (route.kind === 'orbit') {
    const stage = route.zone === 4;
    const c: [number, number, number] = [0, stage ? 3.2 : 1.5, ZONES[route.zone].z - (stage ? 12 : 2)];
    const a = -0.8 + p * 1.6 + Math.sin(t * 0.15) * 0.08;
    const r = stage ? 15 : 9;
    return {
      pos: [c[0] + Math.sin(a) * r, (stage ? 6 : 2.6) + p * 0.8, c[2] + Math.cos(a) * r],
      look: c,
      z: c[2],
    };
  }
  const zA = ZONES[route.from].z + 7;
  const zB = ZONES[route.to].z + 7;
  const z = zA + (zB - zA) * p;
  const x = Math.sin(p * Math.PI * 3 + route.from) * (route.from === route.to ? 0.4 : 2.4);
  const y = 1.9 + Math.sin(p * 9) * 0.12;
  const dir = zB === zA ? -1 : Math.sign(zB - zA);
  return {
    pos: [x, y, z],
    look: [x * 0.4, 1.5, z + dir * 14],
    z,
  };
}

export function zoneAt(z: number) {
  let best = 0;
  let d = Infinity;
  ZONES.forEach((zn, i) => {
    const dd = Math.abs(z - (zn.z + 4));
    if (dd < d) {
      d = dd;
      best = i;
    }
  });
  return best;
}
