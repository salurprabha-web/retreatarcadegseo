'use client';

// ── BlogViewTracker ──────────────────────────────────────────────────────────
// Same pattern as components/view-tracker.tsx (events) — fires once on
// mount, doesn't block rendering, fails silently.

import { useEffect } from 'react';

export function BlogViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId) return;

    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    }).catch(() => {});
  }, [postId]);

  return null;
}
