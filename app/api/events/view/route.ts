import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── POST /api/events/view ────────────────────────────────────────────────────
// Called client-side on every product page load.
// Increments view_count for the given event id.
// Uses service role key so RLS doesn't block the write.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Atomic increment — safe for concurrent requests
    const { error } = await supabase.rpc('increment_event_views', { event_id: id });

    if (error) {
      // Fallback: manual increment if RPC doesn't exist yet
      const { data: event } = await supabase
        .from('events')
        .select('view_count')
        .eq('id', id)
        .single();

      await supabase
        .from('events')
        .update({ view_count: (event?.view_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
