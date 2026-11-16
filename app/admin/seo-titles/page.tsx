'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';

type Row = { kind: 'event' | 'service'; id: string; name: string; url: string; title: string; description: string; problems: string[] };
type Sug = { title: string; description: string; problems: string[]; lead?: string; volume?: number | null; competitors?: string[] };

const lenClass = (n: number, lo: number, hi: number) => (n >= lo && n <= hi ? 'text-green-600' : 'text-amber-600');

export default function SeoTitlesAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [sug, setSug] = useState<Record<string, Sug>>({});
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState('');
  const [dfs, setDfs] = useState(false);
  const [serp, setSerp] = useState(true);

  async function scan() {
    setBusy('scan');
    try { const r = await adminApi('/api/admin/seo-titles', { action: 'scan' }); setRows(r.rows); setTotal(r.total); setDfs(!!r.dataForSeo); setSug({}); setPicked({}); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function writeAll() {
    if (!rows) return;
    const todo = rows.filter((r) => !sug[r.id]);
    setBusy('write');
    try {
      for (let i = 0; i < todo.length; i += 12) {
        setProgress(`Writing ${Math.min(i + 12, todo.length)} of ${todo.length}...`);
        const r = await adminApi('/api/admin/seo-titles', { action: 'suggest', ids: todo.slice(i, i + 12).map((x) => x.id), serp: serp && dfs });
        if (r.serpNote && i === 0) toast.message(`Google lookup note: ${r.serpNote}`);
        setSug((prev) => { const n = { ...prev }; (r.suggestions || []).forEach((s: any) => { if (s.title) n[s.id] = { title: s.title, description: s.description, problems: s.problems || [], lead: s.lead, volume: s.volume, competitors: s.competitors || [] }; }); return n; });
        setPicked((prev) => { const n = { ...prev }; (r.suggestions || []).forEach((s: any) => { if (s.title && !(s.problems || []).length) n[s.id] = true; }); return n; });
      }
      toast.success('Suggestions ready. Read them, then apply.');
    } catch (e: any) { toast.error(e.message); }
    setProgress(''); setBusy('');
  }

  async function apply() {
    if (!rows) return;
    const changes = rows.filter((r) => picked[r.id] && sug[r.id]).map((r) => ({ kind: r.kind, id: r.id, title: sug[r.id].title, description: sug[r.id].description }));
    if (!changes.length) { toast.error('Tick at least one'); return; }
    if (!window.confirm(`Save ${changes.length} new titles and descriptions? They go live within about 5 minutes.`)) return;
    setBusy('apply');
    try { const r = await adminApi('/api/admin/seo-titles', { action: 'apply', changes }); toast.success(`${r.updated} pages updated`); await scan(); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const ready = rows ? rows.filter((r) => sug[r.id]).length : 0;
  const ticked = rows ? rows.filter((r) => picked[r.id] && sug[r.id]).length : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-gray-900">Fix titles and descriptions that Google cuts off</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li><b>Scan</b>: finds product and service pages with a title over about 60 characters, or a description that is too long, short or missing. It is free.</li>
          <li><b>Write better ones</b>: the AI shortens each, keeping the main search phrase and the city that is already there. Nothing is saved yet.</li>
          <li><b>Read, edit, then apply</b>: tick the ones you like. Old and new are side by side.</li>
        </ol>
        <p className="mt-2 text-xs text-gray-500">City pages and service-in-city pages are not listed here: their titles are rewritten by Auto Pages when you publish the upgrades.</p>
        <p className="mt-2 text-xs text-gray-500">Each new title is built around the phrase people search most for that page (from your keyword list and DataForSEO volumes), written to get clicks, and checked so it does not copy another page of yours.</p>
        {rows && (
          <label className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm ${dfs ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
            <input type="checkbox" className="mt-0.5" checked={serp && dfs} disabled={!dfs} onChange={(e) => setSerp(e.target.checked)} />
            <span><b>Look at what Google shows for each phrase</b> (DataForSEO, about 0.2 cent per page). The AI sees the top results and writes a title that stands out. {dfs ? '' : 'Connect DataForSEO to use this.'}</span>
          </label>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={scan} disabled={!!busy}>{busy === 'scan' ? 'Scanning...' : '1. Scan'}</Button>
          <Button variant="outline" onClick={writeAll} disabled={!!busy || !rows || !rows.length}>{busy === 'write' ? progress || 'Writing...' : `2. Write better ones${rows ? ` (${rows.length - ready} left)` : ''}`}</Button>
          <Button onClick={apply} disabled={!!busy || !ticked}>{busy === 'apply' ? 'Saving...' : `3. Apply ${ticked} ticked`}</Button>
          {rows && <span className="text-sm text-gray-500">{rows.length} of {total} pages need work</span>}
        </div>
      </section>

      {rows && rows.length === 0 && <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">All {total} product and service pages already have good titles and descriptions.</div>}

      <div className="space-y-3">
        {(rows || []).map((r) => {
          const s = sug[r.id];
          return (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {s && <input type="checkbox" checked={!!picked[r.id]} onChange={(e) => setPicked({ ...picked, [r.id]: e.target.checked })} />}
                <b className="text-gray-900">{r.name}</b>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{r.kind === 'event' ? 'Product' : 'Service'}</span>
                <a className="text-xs font-medium text-orange-700 hover:underline" href={r.url} target="_blank" rel="noopener noreferrer">Open page</a>
              </div>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-red-50/50 p-3 text-sm">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Now</p>
                  <p className="text-gray-900">{r.title} <span className={`text-xs ${lenClass(r.title.length, 25, 62)}`}>({r.title.length})</span></p>
                  <p className="mt-1 text-gray-600">{r.description || <i>No description</i>} <span className={`text-xs ${lenClass(r.description.length, 110, 158)}`}>({r.description.length})</span></p>
                  <p className="mt-1 text-xs text-amber-700">{r.problems.join(' · ')}</p>
                </div>
                <div className="rounded-lg bg-green-50/50 p-3 text-sm">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">New (you can edit)</p>
                  {s ? (
                    <div className="space-y-2">
                      <Input value={s.title} onChange={(e) => setSug({ ...sug, [r.id]: { ...s, title: e.target.value } })} />
                      <span className={`text-xs ${lenClass(s.title.length, 25, 62)}`}>{s.title.length} characters</span>
                      <textarea className="w-full p-2 text-sm" rows={3} value={s.description} onChange={(e) => setSug({ ...sug, [r.id]: { ...s, description: e.target.value } })} />
                      <span className={`text-xs ${lenClass(s.description.length, 110, 158)}`}>{s.description.length} characters</span>
                      {s.problems.length > 0 && <p className="text-xs text-amber-700">Check: {s.problems.join(', ')}</p>}
                      {s.lead && <p className="text-xs text-gray-500">Built around: <b>{s.lead}</b>{s.volume != null ? ` (${s.volume} searches a month)` : ' (no search data yet)'}</p>}
                      {(s.competitors || []).length > 0 && (
                        <details className="text-xs text-gray-500">
                          <summary className="cursor-pointer">What Google shows now ({s.competitors!.length})</summary>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4">{s.competitors!.map((c, i) => <li key={i}>{c}</li>)}</ul>
                        </details>
                      )}
                    </div>
                  ) : <p className="text-gray-400">Not written yet</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
