'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { canRender3D } from './capability';

const ArcadeScene = dynamic(() => import('./arcade-scene'), { ssr: false });


/**
 * Lazy, safe wrapper around the WebGL scene:
 *  - never rendered on the server (SEO/HTML untouched)
 *  - skipped for prefers-reduced-motion, Save-Data and no-WebGL browsers
 *  - mounted only after the page is idle so it never hurts LCP
 *  - render loop paused while off-screen or tab hidden
 */
export function SceneLoader({
  variant = 'hero',
  className = '',
}: {
  variant?: 'hero' | 'stage';
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!canRender3D(variant)) return;
    const w = window as any;
    const start = () => setEnabled(true);
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200);
    return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
  }, [variant]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      {enabled && <ArcadeScene variant={variant} active={visible} />}
    </div>
  );
}
