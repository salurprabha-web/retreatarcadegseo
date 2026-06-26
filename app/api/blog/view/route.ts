import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── POST /api/blog/view ──────────────────────────────────────────────────────
// Same pattern as /api/events/view — called client-side on every blog post
// page load, increments view_count for the given post id.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase.rpc('increment_blog_views', { post_id: id });

    if (error) {
      const { data: post } = await supabase
        .from('blog_posts')
        .select('view_count')
        .eq('id', id)
        .single();

      await supabase
        .from('blog_posts')
        .update({ view_count: (post?.view_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
