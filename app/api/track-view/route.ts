import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/page-generator';

export const runtime = 'nodejs';

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|facebookexternalhit|whatsapp|telegram/i;

/** POST { path } -> adds one view to that public page. Never fails the visitor's page. */
export async function POST(req: Request) {
  try {
    if (BOT.test(req.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
    const { path } = await req.json();
    if (typeof path !== 'string' || !path.startsWith('/') || path.length > 300) return new NextResponse(null, { status: 204 });
    const clean = path.split('?')[0].split('#')[0].toLowerCase();
    if (/^\/(admin|api|_next)(\/|$)/.test(clean) || /\.[a-z0-9]{2,5}$/.test(clean)) return new NextResponse(null, { status: 204 });
    await adminDb().rpc('increment_page_view', { p_path: clean });
  } catch {
    /* counting is best-effort */
  }
  return new NextResponse(null, { status: 204 });
}
