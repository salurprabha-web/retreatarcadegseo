'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Counts one view per page per browser tab session (a refresh does not count twice).
 * Not counted: admin pages, and anything the server recognises as a bot.
 */
export function PageViewTracker() {
  const pathname = usePathname() || '';

  useEffect(() => {
    if (!pathname || pathname === '/admin' || pathname.startsWith('/admin/')) return;
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    try {
      const key = 'pv:' + path;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* storage blocked: count anyway */
    }
    let vid = '';
    try {
      vid = localStorage.getItem('ra_vid') || '';
      if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)); localStorage.setItem('ra_vid', vid); }
    } catch {
      /* storage blocked: the view still counts, just not as a unique visitor */
    }
    const t = setTimeout(() => {
      try {
        fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, vid }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
