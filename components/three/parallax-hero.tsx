'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ZoneChip } from '@/components/world/zone';

/**
 * Service hero: headline (children, server-rendered) on the left, and the
 * service image floating in a 3D glass frame on the right that tilts with the
 * pointer. The image keeps its alt text and `priority` loading.
 */
export function ParallaxHero({
  src,
  alt,
  chip = 'Zone 02 · Service',
  children,
}: {
  src: string;
  alt: string;
  chip?: string;
  children: React.ReactNode;
}) {
  const wrap = useRef<HTMLElement>(null);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    wrap.current!.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    wrap.current!.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const leave = () => {
    wrap.current?.style.setProperty('--px', '0');
    wrap.current?.style.setProperty('--py', '0');
  };

  return (
    <section
      ref={wrap}
      onPointerMove={move}
      onPointerLeave={leave}
      className="relative flex min-h-[88vh] items-center px-4 pb-16 pt-32 sm:px-6 lg:px-12"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-shadow-soft order-2 lg:order-1 xl:ml-12">
          <ZoneChip className="mb-6">{chip}</ZoneChip>
          <div className="[&_h1]:mb-5 [&_h1]:text-5xl [&_h1]:font-bold [&_h1]:leading-[1.03] [&_h1]:text-white sm:[&_h1]:text-6xl [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-white/85 md:[&_p]:text-xl">
            {children}
          </div>
        </div>

        <div className="order-1 [perspective:1100px] lg:order-2">
          <div
            className="glass relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem] transition-transform duration-200 ease-out motion-reduce:transform-none"
            style={{
              transform:
                'rotateY(calc(var(--px,0) * 14deg)) rotateX(calc(var(--py,0) * -10deg)) translateZ(0)',
            }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 90vw, 560px"
              className="object-cover"
              priority
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
