'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * CSS-3D tilt card with moving glare. Works with any child (including
 * cross-origin <img>, which WebGL textures would block via CORS).
 * Disabled automatically for touch + reduced-motion users via CSS.
 */
export function TiltCard({
  children,
  className,
  max = 12,
  glare = true,
  scale = 1.03,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number>();

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current!);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${((0.5 - py) * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max * 1.4).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--s', String(scale));
    });
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current!);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--s', '1');
  };

  return (
    <div data-tilt className="group/tilt [perspective:1000px]">
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        className={cn(
          'relative [transform-style:preserve-3d] will-change-transform',
          'transition-transform duration-200 ease-out motion-reduce:!transform-none',
          '[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_scale(var(--s,1))]',
          className
        )}
      >
        {children}
        {glare && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover/tilt:opacity-100 motion-reduce:hidden"
            style={{
              background:
                'radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.22), transparent 55%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
    </div>
  );
}
