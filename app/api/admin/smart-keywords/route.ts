import { NextResponse } from 'next/server';
import { adminDb, requireAdmin } from '@/lib/page-generator';
import { runSmartKeywords } from '@/lib/smart-keywords';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST { mode?: 'missing' | 'weak', limit? } -> picks the best main keyword for up to `limit` pages. Call again while `remaining` > 0. */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  try {
    const b = await req.json().catch(() => ({}));
    const r = await runSmartKeywords(adminDb(), { mode: b.mode === 'weak' ? 'weak' : 'missing', limit: Number(b.limit) || 10, skipIds: Array.isArray(b.skipIds) ? b.skipIds : [] });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
