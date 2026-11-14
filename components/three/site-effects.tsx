'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';



/**
 * Mounted once in the root layout. Everything here is progressive enhancement:
 * the server HTML is complete without it (SEO-safe), and each effect switches
 * itself off for reduced-motion / data-saver / weak-device visitors.
 *
 *  - scroll-driven WebGL backdrop (starts on first interaction)
 *  - cursor spotlight + cursor ring that reacts to links and buttons
 *  - magnetic CTAs   ([data-magnetic])
 *  - neon scroll-progress bar
 *  - 3D scroll reveals for headings and section blocks
 */
export function SiteEffects() {
  const glow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdmin = !!pathname?.startsWith('/admin');

  // One-time: pointer-driven effects + progress bar + backdrop
  useEffect(() => {
    if (isAdmin) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // cursor ring (smoothly trails the pointer, grows over interactive elements)
    let raf = 0;
    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100;
    let scale = 1;
    let targetScale = 1;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      mx = e.clientX;
      my = e.clientY;
      if (glow.current) {
        glow.current.style.opacity = '1';
        glow.current.style.transform = `translate3d(${mx - 300}px, ${my - 300}px, 0)`;
      }
      const t = e.target as Element | null;
      const hot = !!t?.closest?.('a, button, [role="button"], input, textarea, summary, [data-tilt], canvas');
      targetScale = hot ? 2.2 : 1;
      if (ring.current) ring.current.style.opacity = '1';

      // magnetic buttons
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height / 2);
        const reach = Math.max(r.width, r.height) * 0.9;
        if (Math.hypot(dx, dy) < reach) {
          el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
          el.style.transition = 'transform 0.15s ease-out';
        } else if (el.style.transform) {
          el.style.transform = '';
          el.style.transition = 'transform 0.4s cubic-bezier(.2,.8,.2,1)';
        }
      });
    };
    const loop = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      scale += (targetScale - scale) * 0.2;
      if (ring.current) ring.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    if (finePointer) {
      window.addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }


    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, [isAdmin]);

  // Per-route: 3D scroll reveals. Content is visible in server HTML; the hidden
  // state is applied only to below-the-fold elements after hydration.
  useEffect(() => {
    if (isAdmin) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).dataset.reveal = 'shown';
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -6% 0px' }
    );
    const scan = () => {
      document
        .querySelectorAll<HTMLElement>('main h2, main section > div, main details, main article')
        .forEach((el) => {
          if (seen.has(el) || el.closest('[data-tilt]') || el.closest('[data-no-reveal]')) return;
          seen.add(el);
          if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
          el.classList.add('reveal-3d');
          el.dataset.reveal = 'hidden';
          io.observe(el);
        });
    };
    const timers = [500, 1800, 4000].map((ms) => setTimeout(scan, ms));
    return () => {
      timers.forEach(clearTimeout);
      io.disconnect();
    };
  }, [isAdmin, pathname]);

  if (isAdmin) return null;

  return (
    <>
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[600px] w-[600px] rounded-full opacity-0 transition-opacity duration-500 [mix-blend-mode:screen] md:block"
        style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.13), transparent 62%)' }}
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-8 w-8 rounded-full border border-orange-300/70 opacity-0 [mix-blend-mode:screen] md:block"
        style={{ background: 'rgba(251,146,60,0.08)' }}
      />
      <div aria-hidden className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[3px]">
        <div
          ref={bar}
          className="h-full origin-left bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 shadow-[0_0_12px_rgba(251,146,60,0.8)]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </>
  );
}
