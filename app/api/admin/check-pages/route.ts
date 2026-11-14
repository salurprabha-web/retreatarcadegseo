import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/page-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

/** POST { urls: string[] } -> the real status code of each public page (only this site's own addresses are fetched) */
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not signed in as admin' }, { status: 401 });
  const { urls } = await req.json().catch(() => ({ urls: [] }));
  const list: string[] = (Array.isArray(urls) ? urls : []).filter((u) => typeof u === 'string' && u.startsWith(SITE + '/')).slice(0, 40);
  const results: Record<string, number> = {};
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(
      list.slice(i, i + 8).map(async (u) => {
        try {
          const r = await fetch(u, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'RetreatArcadeAdminCheck' }, signal: AbortSignal.timeout(20000) });
          results[u] = r.status;
        } catch {
          results[u] = 0;
        }
      })
    );
  }
  return NextResponse.json({ results });
}
