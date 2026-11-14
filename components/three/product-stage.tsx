'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Move3d } from 'lucide-react';
import { EventImage } from '@/components/event-image';

/**
 * Interactive 3D product viewer.
 * - WebGL particle/ring backdrop (lazy, skipped on low-power setups)
 * - The product image floats on a layered 3D slab you can drag to rotate
 *   (touch + mouse), with inertia, idle sway and a reset button.
 * - Real <img> stays in the DOM → crawlable, alt text preserved.
 */
export function ProductStage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const slab = useRef<HTMLDivElement>(null);
  const state = useRef({ rx: 0, ry: 0, vx: 0, vy: 0, dragging: false, lastX: 0, lastY: 0, idle: 0 });
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let t0 = performance.now();
    const loop = (now: number) => {
      const s = state.current;
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      if (!s.dragging) {
        s.idle += dt;
        // inertia
        s.ry += s.vy;
        s.rx += s.vx;
        s.vy *= 0.93;
        s.vx *= 0.93;
        // ease back toward a gentle sway
        const sway = reduce ? 0 : Math.sin(s.idle * 0.8) * 14;
        const swayX = reduce ? 0 : Math.cos(s.idle * 0.6) * 4;
        // ease toward the nearest full turn (+ sway) so it settles the short way round
        const target = Math.round(s.ry / 360) * 360 + sway;
        s.ry += (target - s.ry) * 0.03;
        s.rx += (swayX - s.rx) * 0.05;
      }
      s.rx = Math.max(-40, Math.min(40, s.rx));
      if (slab.current) {
        slab.current.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const down = (e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.vx = s.vy = 0;
    setHint(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.ry += dx * 0.45;
    s.rx -= dy * 0.3;
    s.vy = dx * 0.12;
    s.vx = -dy * 0.06;
    s.idle = 0;
  };
  const up = (e: React.PointerEvent) => {
    state.current.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };
  const reset = () => {
    const s = state.current;
    s.vx = s.vy = 0;
    s.rx = 0;
    s.ry = Math.round(s.ry / 360) * 360;
    s.idle = 0;
  };

  return (
    <div
      className={`glass relative isolate overflow-hidden rounded-[2rem] ${className}`}
    >
      {/* glow + grid floor */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 38%, rgba(251,146,60,0.22), transparent 70%), radial-gradient(50% 50% at 15% 85%, rgba(139,92,246,0.25), transparent 70%), radial-gradient(40% 40% at 90% 15%, rgba(34,211,238,0.14), transparent 70%)',
        }}
      />
      

      <div
        className="relative z-10 flex h-[380px] items-center justify-center px-6 py-6 sm:h-[500px] lg:h-[600px] [perspective:1100px] cursor-grab active:cursor-grabbing touch-pan-y select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onDoubleClick={reset}
      >
        <div ref={slab} className="relative [transform-style:preserve-3d] will-change-transform">
          {/* back plate (depth) */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/40 to-violet-600/40 blur-sm"
            style={{ transform: 'translateZ(-46px) scale(1.02)' }}
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-orange-300/30 bg-white/[0.04]"
            style={{ transform: 'translateZ(-22px) scale(1.01)' }}
          />
          {/* the product itself */}
          <div
            className="relative aspect-[4/3] w-[min(82vw,320px)] overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-[0_30px_80px_-20px_rgba(251,146,60,0.45)] sm:w-[440px] lg:w-[540px]"
            style={{ transform: 'translateZ(0)' }}
          >
            <EventImage
              src={src}
              alt={alt}
              className="pointer-events-none block h-full w-full object-contain"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
            />
          </div>
          {/* floating accent chip in front */}
          <span
            aria-hidden
            className="absolute -right-3 -top-3 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg"
            style={{ transform: 'translateZ(60px)' }}
          >
            360° view
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-between px-4 text-xs text-white/60">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur transition-opacity ${hint ? 'opacity-100' : 'opacity-0'}`}
        >
          <Move3d className="h-3.5 w-3.5 text-orange-400" /> Drag to rotate
        </span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur hover:text-white"
          aria-label="Reset 3D view"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}
