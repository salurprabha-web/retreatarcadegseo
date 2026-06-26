import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── POST /api/services/view ─────────────────────────────────────────────────
// Same pattern as /api/events/view — called client-side on every service
// page load, increments view_count for the given service id.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.rpc('increment_service_views', { service_id: id });

    if (error) {
      const { data: service } = await supabase
        .from('services')
        .select('view_count')
        .eq('id', id)
        .single();

      await supabase
        .from('services')
        .update({ view_count: (service?.view_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
