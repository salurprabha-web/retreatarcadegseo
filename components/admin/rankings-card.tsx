'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/components/admin/admin-api';

type Row = { keyword: string; city_slug: string | null; owner_type: string; owner_url: string | null; volume: number | null; rank_position: number | null; rank_previous: number | null; rank_best: number | null; rank_url: string | null; rank_checked_at: string | null };

const path = (u: string | null) => { try { return new URL(u || '', 'https://x.in').pathname.replace(/\/+$/, '').toLowerCase(); } catch { return String(u || '').toLowerCase(); } };

function Change({ r }: { r: Row }) {
  if (!r.rank_checked_at) return <span className="text-gray-400">not checked yet</span>;
  const now = r.rank_position, was = r.rank_previous;
  if (now == null && was == null) return <span className="text-gray-400">-</span>;
  if (was == null) return <span className="font-semibold text-green-700">new</span>;
  if (now == null) return <span className="font-semibold text-red-600">dropped out</span>;
  const d = was - now;
  if (d === 0) return <span className="text-gray-400">same</span>;
  return <span className={`font-semibold ${d > 0 ? 'text-green-700' : 'text-red-600'}`}>{d > 0 ? `up ${d}` : `down ${-d}`}</span>;
}

/** Where your pages appear in Google India, checked automatically by the daily run. */
export function RankingsCard({ cities }: { cities: { slug: string; city: string }[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(true);
  const [city, setCity] = useState('');
  const [bucket, setBucket] = useState<'all' | 'top3' | 'top10' | 'top30' | 'none' | 'unchecked'>('all');
  const [busy, setBusy] = useState(false);
  const [dfs, setDfs] = useState(true);
  const [show, setShow] = useState(25);

  const load = useCallback(async () => {
    try { const r = await adminApi('/api/admin/keywords', { action: 'rankings', city: city || undefined }); setReady(r.ready !== false); setRows(r.rows || []); setDfs(r.dataForSeo !== false); } catch (e: any) { toast.error(e.message); }
  }, [city]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    top3: rows.filter((r) => r.rank_position != null && r.rank_position <= 3).length,
    top10: rows.filter((r) => r.rank_position != null && r.rank_position <= 10).length,
    top30: rows.filter((r) => r.rank_position != null).length,
    none: rows.filter((r) => r.rank_checked_at && r.rank_position == null).length,
    unchecked: rows.filter((r) => !r.rank_checked_at).length,
  }), [rows]);

  const shown = rows
    .filter((r) => bucket === 'all' || (bucket === 'top3' && r.rank_position != null && r.rank_position <= 3) || (bucket === 'top10' && r.rank_position != null && r.rank_position <= 10) || (bucket === 'top30' && r.rank_position != null) || (bucket === 'none' && r.rank_checked_at && r.rank_position == null) || (bucket === 'unchecked' && !r.rank_checked_at))
    .sort((a, b) => (a.rank_position ?? 999) - (b.rank_position ?? 999) || (b.volume ?? 0) - (a.volume ?? 0));

  async function checkNow() {
    setBusy(true);
    try {
      const r = await adminApi('/api/admin/keywords', { action: 'rank_now' });
      if (r.skipped && !r.checked) toast.error(`Not checked: ${r.skipped}`);
      else toast.success(`Checked ${r.checked} phrases: ${r.improved} improved, ${r.dropped} dropped, ${r.top10} in the top 10`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  }

  function download() {
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [['Phrase', 'City', 'Searches/month', 'Position now', 'Previous', 'Best', 'Page Google shows', 'Page that owns it', 'Checked'].map(esc).join(',')];
    rows.forEach((r) => lines.push([r.keyword, r.city_slug, r.volume ?? '', r.rank_position ?? 'not in top 30', r.rank_previous ?? '', r.rank_best ?? '', r.rank_url, r.owner_url, r.rank_checked_at ? new Date(r.rank_checked_at).toLocaleDateString('en-IN') : ''].map(esc).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'google-rankings.csv';
    a.click();
  }

  const chip = (k: typeof bucket, label: string, n: number) => (
    <button key={k} onClick={() => setBucket(bucket === k ? 'all' : k)} className={`rounded-xl border px-3 py-2 text-left transition ${bucket === k ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
      <div className="text-xl font-bold text-gray-900">{n}</div><div className="text-xs text-gray-500">{label}</div>
    </button>
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h2 className="text-lg font-bold text-gray-900">Google rankings</h2>
          <p className="text-sm text-gray-500">Where your pages appear in Google India for their main phrase (top 30). The daily run checks about 40 phrases a day, so every phrase is re-checked about once a week (city pages every 2 days). New pages often take weeks to show: &quot;not in top 30&quot; at first is normal.</p>
        </div>
        <select className="p-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)}><option value="">All cities</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}</select>
        <Button variant="outline" onClick={checkNow} disabled={busy || !dfs || !ready}>{busy ? 'Checking, up to a minute...' : 'Check 25 phrases now'}</Button>
        <Button variant="outline" onClick={download} disabled={!rows.length}>Download (CSV)</Button>
      </div>

      {!ready && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">One setup step first: run <b>AUTO_PAGES_STEP10.sql</b> in Supabase (SQL Editor), then press Check now.</div>}
      {ready && !dfs && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">DataForSEO is not connected, so rankings cannot be checked. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Vercel.</div>}

      {ready && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {chip('top3', 'Top 3', counts.top3)}
            {chip('top10', 'Top 10 (page one)', counts.top10)}
            {chip('top30', 'In the top 30', counts.top30)}
            {chip('none', 'Not in top 30', counts.none)}
            {chip('unchecked', 'Not checked yet', counts.unchecked)}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400"><th className="py-2 pr-3">Phrase</th><th className="pr-3">City</th><th className="pr-3">Searches</th><th className="pr-3">Position</th><th className="pr-3">Change</th><th className="pr-3">Best</th><th>Page shown</th></tr></thead>
              <tbody>
                {shown.slice(0, show).map((r) => {
                  const wrong = !!r.rank_url && !!r.owner_url && path(r.rank_url) !== path(r.owner_url);
                  return (
                    <tr key={r.keyword} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-medium text-gray-900">{r.keyword}</td>
                      <td className="pr-3 text-gray-500">{r.city_slug || '-'}</td>
                      <td className="pr-3 text-gray-500">{r.volume ?? '-'}</td>
                      <td className="pr-3 font-semibold">{r.rank_checked_at ? (r.rank_position ?? <span className="font-normal text-gray-400">not in top 30</span>) : <span className="font-normal text-gray-400">-</span>}</td>
                      <td className="pr-3"><Change r={r} /></td>
                      <td className="pr-3 text-gray-500">{r.rank_best ?? '-'}</td>
                      <td className="text-xs">{r.rank_url ? <span className={wrong ? 'font-semibold text-amber-700' : 'text-gray-500'}>{path(r.rank_url)}{wrong ? ' (not the page that owns this phrase)' : ''}</span> : <span className="text-gray-300">-</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!shown.length && <p className="py-6 text-center text-sm text-gray-400">Nothing here yet. The first daily run (or Check now) fills this in.</p>}
            {shown.length > show && <button className="mt-3 text-sm font-medium text-orange-700 hover:underline" onClick={() => setShow(show + 50)}>Show more ({shown.length - show} left)</button>}
          </div>
        </>
      )}
    </section>
  );
}
