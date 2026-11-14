'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to values like "500+", "50K+", "65+" when scrolled into view.
 * Server HTML always contains the final value (SEO + no-JS safe).
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value.trim());
  const [shown, setShown] = useState<string | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!m || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num);
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1600;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        setShown(`${pre}${(target * eased).toFixed(decimals)}${post}`);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {shown ?? value}
    </span>
  );
}
