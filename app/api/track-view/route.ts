import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/page-generator';

export const runtime = 'nodejs';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|facebookexternalhit|whatsapp|telegram/i;

/** POST { path } -> adds one view to that public page. Never fails the visitor's page. */
export async function POST(req: Request) {
  try {
    if (BOT.test(req.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
    const { path, vid } = await req.json();
    if (typeof path !== 'string' || !path.startsWith('/') || path.length > 300) return new NextResponse(null, { status: 204 });
    const clean = path.split('?')[0].split('#')[0].toLowerCase();
    if (/^\/(admin|api|_next)(\/|$)/.test(clean) || /\.[a-z0-9]{2,5}$/.test(clean)) return new NextResponse(null, { status: 204 });
    // the visitor is stored only as a one-way hash
    const visitor = typeof vid === 'string' && vid.length >= 16 && vid.length <= 80 ? createHash('sha256').update(`${process.env.SUPABASE_SERVICE_ROLE_KEY || 'ra'}:${vid}`).digest('hex') : null;
    const db = adminDb();
    const r = await db.rpc('record_visit', { p_path: clean, p_visitor: visitor });
    if (r.error) await db.rpc('increment_page_view', { p_path: clean }); // STEP9 not run yet
  } catch {
    /* counting is best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
