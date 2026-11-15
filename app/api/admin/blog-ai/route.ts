import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { generateBlogPost } from '@/lib/blog-writer';
import { nextSlot, type Cadence } from '@/lib/blog-schedule';

export const runtime = 'nodejs';
export const maxDuration = 60;

const textOf = (html: string) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** The AI posts only: hand-made posts are never touched from this screen. */
const isAi = (p: any) => !!p.generated_by;

/**
 * POST { action, ... }  (admin only)
 *  topics    { city? }                      unowned keyword ideas for the next posts
 *  generate  { keyword, idea, citySlug, productSlug, serviceSlug, images[] }  -> a DRAFT
 *  list      -> drafts, scheduled, published
 *  get       { id }                          full text for the preview
 *  publish   { id }                          live now
 *  schedule  { id, at }                      live at that time (ISO)
 *  queue     { id, perWeek: 2|3 }            next free slot (10:00 IST)
 *  unschedule{ id }                          back to draft
 *  delete    { id }                          drafts and scheduled posts only
 */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const db = adminDb();
    const now = new Date();

    if (b.action === 'topics') {
      let q = db.from('seo_keywords').select('keyword, city_slug, volume, intent').eq('owner_type', 'none').eq('intent', 'info').order('volume', { ascending: false, nullsFirst: false }).limit(60);
      if (b.city) q = q.eq('city_slug', b.city);
      const { data, error } = await q;
      if (error) return NextResponse.json({ topics: [], note: 'Keyword list not ready: run AUTO_PAGES_STEP5.sql, then open Keywords and click "Add ideas".' });
      return NextResponse.json({ topics: (data || []).slice(0, 24) });
    }

    if (b.action === 'generate') {
      const out = await generateBlogPost(db, { idea: String(b.idea || ''), keyword: String(b.keyword || ''), citySlug: b.citySlug || null, productSlug: b.productSlug || null, serviceSlug: b.serviceSlug || null, images: Array.isArray(b.images) ? b.images : String(b.images || '').split(/\r?\n/) });
      return NextResponse.json(out);
    }

    if (b.action === 'list') {
      const { data, error } = await db.from('blog_posts').select('id, title, slug, status, published_at, created_at, focus_keyword, generated_by, city_slug, view_count, content, featured_image_url').order('created_at', { ascending: false }).limit(200);
      if (error) {
        // before STEP5 the extra columns do not exist; fall back to the basic list
        const basic = await db.from('blog_posts').select('id, title, slug, status, published_at, created_at, view_count, content, featured_image_url').order('created_at', { ascending: false }).limit(200);
        if (basic.error) throw basic.error;
        return NextResponse.json({ posts: shape(basic.data as any[], now), step5: false });
      }
      return NextResponse.json({ posts: shape(data as any[], now), step5: true });
    }

    if (b.action === 'get') {
      const { data, error } = await db.from('blog_posts').select('id, title, content, excerpt, meta_title, meta_description, featured_image_url').eq('id', b.id).single();
      if (error) throw error;
      return NextResponse.json({ post: data });
    }

    // every change below only works on AI posts that are not yet live
    const { data: post } = b.id ? await db.from('blog_posts').select('id, status, published_at, generated_by').eq('id', b.id).maybeSingle() : { data: null as any };
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const live = post.status === 'published' && post.published_at && new Date(post.published_at) <= now;

    if (b.action === 'publish') {
      if (live) return NextResponse.json({ error: 'Already live' }, { status: 400 });
      const { error } = await db.from('blog_posts').update({ status: 'published', published_at: now.toISOString(), updated_at: now.toISOString() }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true, at: now.toISOString() });
    }

    if (b.action === 'schedule') {
      if (live) return NextResponse.json({ error: 'Already live' }, { status: 400 });
      const at = new Date(b.at);
      if (Number.isNaN(at.getTime())) return NextResponse.json({ error: 'Choose a date and time' }, { status: 400 });
      if (at.getTime() < now.getTime() + 60000) return NextResponse.json({ error: 'Pick a time in the future (or use Publish now)' }, { status: 400 });
      const { error } = await db.from('blog_posts').update({ status: 'published', published_at: at.toISOString(), updated_at: now.toISOString() }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true, at: at.toISOString() });
    }

    if (b.action === 'queue') {
      if (live) return NextResponse.json({ error: 'Already live' }, { status: 400 });
      const per: Cadence = Number(b.perWeek) === 2 ? 2 : 3;
      const { data: fut } = await db.from('blog_posts').select('published_at').eq('status', 'published').gt('published_at', now.toISOString()).neq('id', b.id).order('published_at', { ascending: false }).limit(1);
      const after = Math.max(now.getTime(), fut?.[0]?.published_at ? new Date(fut[0].published_at).getTime() : 0);
      const slot = nextSlot(after, per);
      const { error } = await db.from('blog_posts').update({ status: 'published', published_at: slot.toISOString(), updated_at: now.toISOString() }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true, at: slot.toISOString() });
    }

    if (b.action === 'unschedule') {
      if (live) return NextResponse.json({ error: 'This post is already live. Unpublish it in Blog if needed.' }, { status: 400 });
      const { error } = await db.from('blog_posts').update({ status: 'draft', published_at: null, updated_at: now.toISOString() }).eq('id', b.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (b.action === 'delete') {
      if (live || !isAi(post)) return NextResponse.json({ error: 'Only AI drafts and scheduled AI posts can be deleted here' }, { status: 400 });
      const { error } = await db.from('blog_posts').delete().eq('id', b.id);
      if (error) throw error;
      // free the keyword again
      await db.from('seo_keywords').update({ owner_type: 'none', owner_ref: null, owner_url: null, status: 'idea', updated_at: now.toISOString() }).eq('owner_ref', b.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

function shape(rows: any[], now: Date) {
  return rows.map((p) => {
    const html = String(p.content || '');
    const note = String(p.generated_by || '').split('needs review:')[1]?.trim() || '';
    const at = p.published_at ? new Date(p.published_at) : null;
    const state = p.status === 'published' && at && at > now ? 'scheduled' : p.status === 'published' ? 'live' : 'draft';
    return {
      id: p.id, title: p.title, slug: p.slug, state, at: p.published_at, created_at: p.created_at,
      keyword: p.focus_keyword || '', ai: !!p.generated_by, review: note, city: p.city_slug || '', views: p.view_count || 0,
      words: textOf(html).split(' ').filter(Boolean).length, links: (html.match(/<a\s/gi) || []).length, images: (html.match(/<img\s/gi) || []).length,
      hero: p.featured_image_url || '',
    };
  });
}
