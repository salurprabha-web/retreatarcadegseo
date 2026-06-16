'use client';

// ── ViewTracker ──────────────────────────────────────────────────────────────
// Drop this component into any page to silently increment view_count.
// It fires once on mount, doesn't block rendering, fails silently.

import { useEffect } from 'react';

export function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    if (!eventId) return;

    // Fire-and-forget — never blocks page render or throws to user
    fetch('/api/events/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    }).catch(() => {}); // silent fail
  }, [eventId]);

  return null; // renders nothing
}
