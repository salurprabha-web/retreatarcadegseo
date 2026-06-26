'use client';

// ── ServiceViewTracker ──────────────────────────────────────────────────────
// Same pattern as components/view-tracker.tsx (events) — fires once on
// mount, doesn't block rendering, fails silently.

import { useEffect } from 'react';

export function ServiceViewTracker({ serviceId }: { serviceId: string }) {
  useEffect(() => {
    if (!serviceId) return;

    fetch('/api/services/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: serviceId }),
    }).catch(() => {});
  }, [serviceId]);

  return null;
}
