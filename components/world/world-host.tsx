'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ZONES, cameraFor, routeFor, zoneAt } from './world-math';
import { webglSupported, onFirstInteraction } from '@/components/three/capability';

const WorldScene = dynamic(() => import('./world-scene'), { ssr: false });

function worldAllowed() {
  if (/[?&]world=on/.test(window.location.search) && webglSupported()) return { ok: true, lite: false };
  const nav = navigator as any;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { ok: false, lite: false };
  const conn = nav.connection;
  const phone = window.innerWidth < 768;
  // 3g only blocks phones: Chrome's estimate can read low on fast desktop connections
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '') || (phone && conn?.effectiveType === '3g')) return { ok: false, lite: false };
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return { ok: false, lite: false };
  // phones get the static poster: a live 3D scene behind a scrolling page made phones lag
  if (phone) return { ok: false, lite: false };
  const cores = nav.hardwareConcurrency || 8;
  if (!webglSupported()) return { ok: false, lite: false };
  return { ok: true, lite: cores <= 4 };
}

/**
 * The persistent 3D arcade world behind every page. The page's real HTML scrolls
 * over it; the scroll position flies the camera. Without WebGL (or on weak
 * devices) the same palette is rendered as a static poster, so the layout and
 * all content still work.
 */
export function WorldHost() {
  const pathname = usePathname() || '/';
  const isAdmin = pathname.startsWith('/admin');
  const route = useMemo(() => routeFor(pathname), [pathname]);
  const progress = useRef(0);
  const [mode, setMode] = useState<{ on: boolean; lite: boolean }>({ on: false, lite: false });
  const [visible, setVisible] = useState(true);
  const [zone, setZone] = useState(0);
  const routeRef = useRef(route);
  routeRef.current = route;

  useEffect(() => {
    if (isAdmin) return;
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.current = Math.min(1, Math.max(0, window.scrollY / max));
      // HUD zone (same math as the scene, so it works without WebGL too)
      const z = cameraFor(routeRef.current, progress.current, 0).z;
      setZone((prev) => {
        const nz = zoneAt(z);
        return prev === nz ? prev : nz;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const t = setTimeout(onScroll, 800); // after content settles
    const vis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', vis);

    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [isAdmin, pathname]);

  // Start the 3D world on the visitor's first interaction. Kept in its own effect
  // (not tied to the route) so a click on a nav link that changes the page can
  // never cancel the pending start.
  useEffect(() => {
    if (isAdmin) return;
    // decide at the moment of first interaction, not at page load (network estimates settle later)
    return onFirstInteraction(() => {
      const a = worldAllowed();
      if (a.ok) setMode({ on: true, lite: a.lite });
    });
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      {/* static poster: always there (first paint, fallback, weak devices) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30 overflow-hidden"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 38%, rgba(139,92,246,0.35), transparent 70%), radial-gradient(40% 35% at 15% 85%, rgba(251,146,60,0.28), transparent 70%), radial-gradient(40% 35% at 88% 80%, rgba(34,211,238,0.2), transparent 70%), #06081f',
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] opacity-50 [perspective:420px]"
          style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }}
        >
          <div
            className="absolute inset-0 origin-bottom [transform:rotateX(64deg)]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(251,146,60,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      </div>

      {mode.on && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
          <WorldScene route={route} progress={progress} active={visible} lite={mode.lite} />
        </div>
      )}

      {/* legibility veil over the world */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,7,26,0.62) 0%, rgba(5,7,26,0.18) 35%, rgba(5,7,26,0.18) 65%, rgba(5,7,26,0.7) 100%), radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(5,7,26,0.55))',
        }}
      />

      {/* zone HUD */}
      <nav
        aria-label="Arcade zones"
        className="pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-start gap-3 xl:flex"
      >
        {ZONES.map((z, i) => {
          const on = i === zone;
          return (
            <div key={z.name} className="flex items-center gap-3">
              <span
                className={`block rounded-full transition-all duration-500 ${
                  on ? 'h-3 w-3 bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.9)]' : 'h-1.5 w-1.5 bg-white/30'
                }`}
              />
              <span
                className={`hidden text-[10px] font-semibold uppercase tracking-[0.22em] transition-all duration-500 min-[1700px]:block ${
                  on ? 'translate-x-0 text-white opacity-100' : '-translate-x-2 text-white/40 opacity-0'
                }`}
              >
                {z.name}
              </span>
            </div>
          );
        })}
      </nav>
    </>
  );
}
