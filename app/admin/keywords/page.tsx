'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';
import { supabase } from '@/lib/supabase-client';
import { RankingsCard } from '@/components/admin/rankings-card';

/** The run history as a spreadsheet file: one row per page keyword change, one per step. */
function downloadReport(runs: any[]) {
  const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [['Run time (IST)', 'Type', 'Step or page', 'City', 'Result / before', 'Keyword now', 'Searches'].map(esc).join(',')];
  for (const r of runs) {
    const when = new Date(r.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    (r.steps || []).forEach((s: any) => lines.push([when, r.trigger, s.label, '', s.summary, '', ''].map(esc).join(',')));
    (r.changes || []).forEach((c: any) => lines.push([when, r.trigger, c.page, c.city, c.from || 'none', c.to, c.volume ?? ''].map(esc).join(',')));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'seo-automatic-runs.csv';
  a.click();
}

export default function KeywordsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [city, setCity] = useState('');
  const [owner, setOwner] = useState<'all' | 'owned' | 'free'>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [needsSql, setNeedsSql] = useState(false);
  const [dfs, setDfs] = useState(false);
  const [noVol, setNoVol] = useState(0);
  const [csv, setCsv] = useState('');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [cron, setCron] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [openRun, setOpenRun] = useState('');
  const [coverage, setCoverage] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi('/api/admin/keywords', { action: 'list', city: city || undefined, owner, q: q || undefined, page });
      setRows(r.rows || []); setTotal(r.total || 0); setDfs(!!r.dataForSeo); setNoVol(r.withoutVolume || 0); setNeedsSql(false); setCron(!!r.cron); setLastRun(r.lastRun || null); setRuns(r.runs || []); setCoverage(r.coverage || null);
    } catch (e: any) {
      if (e.data?.needsSql) setNeedsSql(true); else toast.error(e.message);
    }
  }, [city, owner, q, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from('locations').select('slug, city').order('city').then(({ data }) => setCities(data || []));
  }, []);

  async function run(action: string, extra: any = {}, label = '') {
    setBusy(action);
    try {
      let r: any = null;
      for (let attempt = 0; attempt < 3 && !r; attempt++) {
        try { r = await adminApi('/api/admin/keywords', { action, ...extra }); }
        catch (e: any) { if (attempt === 2) throw e; await new Promise((res) => setTimeout(res, 1500)); } // a slow answer is retried; finished work is not repeated
      }
      if (action === 'sync') { setConflicts(r.conflicts || []); toast.success(`Registered ${r.added} new, ${r.claimed} claimed, ${r.updated} updated` + (r.conflicts?.length ? `, ${r.conflicts.length} clashes to look at` : '')); }
      else if (action === 'candidates') toast.success(`${r.added} new ideas added`);
      else if (action === 'import') toast.success(`${r.added} added, ${r.updated} updated`);
      else if (action === 'volumes') toast.success(r.note || `Search volumes added to ${r.updated} phrases`);
      else if (label) toast.success(label);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const perPage = 100;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      {needsSql && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">One setup step first</p>
          <p className="mt-1">Run <b>AUTO_PAGES_STEP5.sql</b> in Supabase (SQL Editor). It creates the keyword list. Then reload this page.</p>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-gray-900">What to do here</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li><b>Register my pages</b>: records the main keyword of every published page and blog post, so each phrase has one owner.</li>
          <li><b>Add ideas</b>: creates phrase ideas for every live city (free). Many become blog topics.</li>
          <li><b>Get search volumes</b>: fills in how many people search each phrase (needs DataForSEO, see below), or paste a Keyword Planner export.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => run('sync')} disabled={!!busy}>{busy === 'sync' ? 'Working...' : '1. Register my pages'}</Button>
          <Button variant="outline" onClick={() => run('candidates')} disabled={!!busy}>{busy === 'candidates' ? 'Working...' : '2. Add ideas for every city'}</Button>
          <Button variant="outline" onClick={() => run('volumes', { limit: 300 })} disabled={!!busy || !dfs}>{busy === 'volumes' ? 'Asking DataForSEO...' : `3. Get search volumes (${noVol} without)`}</Button>
        </div>
        {!dfs && !needsSql && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Connect DataForSEO (when you are ready)</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>In DataForSEO open <b>API Access</b> and copy the <b>API login</b> and <b>API password</b> (not your account password).</li>
              <li>In Vercel: your project, <b>Settings</b>, <b>Environment Variables</b>. Add <code>DATAFORSEO_LOGIN</code> and <code>DATAFORSEO_PASSWORD</code>, tick all environments, <b>Save</b>.</li>
              <li><b>Deployments</b>, three dots on the top row, <b>Redeploy</b>. Then reload this page: the button above turns on.</li>
              <li>Set a spending limit in DataForSEO. Each press asks for at most 300 phrases.</li>
            </ol>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {coverage && (
          <div className="mb-4 rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">Page keywords: <span className={coverage.missing ? 'text-amber-700' : 'text-green-700'}>{coverage.withKeyword} of {coverage.total}</span> main pages have one</p>
              <p className="text-xs text-gray-500">{coverage.missing ? `${coverage.missing} left. They are finished automatically every day.` : 'All done. New pages get theirs when they are written.'}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${coverage.total ? Math.round((coverage.withKeyword / coverage.total) * 100) : 100}%` }} /></div>
          </div>
        )}
        <h2 className="text-lg font-bold text-gray-900">Automatic daily run (about 7 AM India time)</h2>
        <p className="mt-1 text-sm text-gray-500">Every morning the site does this by itself, in small steps: fills empty city details, finishes half-done product launches, looks up search volumes, picks the main keyword for pages that have none, and records which page owns which phrase. On Mondays it also adds new phrase ideas. It never publishes anything and never changes your titles or text. On the free Vercel plan the run starts somewhere inside the 7 o&apos;clock hour.</p>
        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
          {lastRun ? (
            <p><b className={lastRun.problems?.length ? 'text-amber-700' : 'text-green-700'}>Last run:</b> {new Date(lastRun.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST ({lastRun.trigger === 'manual' ? 'started by you' : 'automatic'}), {lastRun.headline}.</p>
          ) : (
            <p className="text-gray-500">Not run yet. {cron ? 'It runs tomorrow morning, or press "Run it now".' : 'It is switched off until you add the secret below.'}</p>
          )}
        </div>
        {!cron && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Switch it on (one minute)</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Make up a long random password (30+ letters and numbers). This is only a lock so that nobody else can start the run.</li>
              <li>Vercel, your project, <b>Settings</b>, <b>Environment Variables</b>: add <code>CRON_SECRET</code> with that value, all environments, <b>Save</b>.</li>
              <li><b>Deployments</b>, three dots on the top row, <b>Redeploy</b>. Vercel then runs the job every morning and sends the secret itself.</li>
            </ol>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-3">
          <Button disabled={!!busy} onClick={async () => { setBusy('runnow'); try { const r = await adminApi('/api/admin/keywords', { action: 'run_now' }); toast.success(`Run finished: ${r.headline}`); await load(); } catch (e: any) { toast.error(e.message); } setBusy(''); }}>{busy === 'runnow' ? 'Running, up to a minute...' : 'Run it now'}</Button>
          <Button variant="outline" disabled={!!busy} onClick={async () => { setBusy('smart'); try { const r = await adminApi('/api/admin/smart-keywords', { mode: 'weak', limit: 10 }); toast.success(`Checked ${r.processed} pages, changed ${r.changed}${r.remaining ? `. ${r.remaining} more to check, press again` : ''}`); await load(); } catch (e: any) { toast.error(e.message); } setBusy(''); }}>{busy === 'smart' ? 'Working...' : 'Improve page keywords now (10 pages at a time)'}</Button>
          {runs.length > 0 && <Button variant="outline" onClick={() => downloadReport(runs)}>Download report (CSV)</Button>}
        </div>

        {runs.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-gray-800">What the automatic run did (last {runs.length} runs)</p>
            <div className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-200">
                  <button className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm" onClick={() => setOpenRun(openRun === r.id ? '' : r.id)}>
                    <span className="font-medium text-gray-900">{new Date(r.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST <span className="text-xs text-gray-400">· {r.trigger === 'manual' ? 'started by you' : 'automatic'} · {Math.round((r.ms || 0) / 1000)}s</span></span>
                    <span className={`text-xs font-semibold ${r.problems?.length ? 'text-amber-700' : 'text-green-700'}`}>{r.headline}</span>
                  </button>
                  {openRun === r.id && (
                    <div className="space-y-3 border-t border-gray-100 px-4 py-3 text-sm">
                      <ul className="space-y-1">
                        {(r.steps || []).map((s: any) => (
                          <li key={s.name} className="flex gap-2"><span className={s.ok ? (s.skipped ? 'text-gray-400' : 'text-green-600') : 'text-red-600'}>{s.ok ? (s.skipped ? '○' : '✓') : '✗'}</span><span><b>{s.label}:</b> {s.summary}</span></li>
                        ))}
                      </ul>
                      {(r.problems || []).length > 0 && <div className="rounded-lg bg-amber-50 p-3 text-amber-900"><b>Problems:</b><ul className="list-disc pl-5">{r.problems.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>}
                      {(r.changes || []).length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="text-xs">
                            <thead><tr><th className="px-2 py-1 text-left">Page</th><th className="px-2 py-1 text-left">City</th><th className="px-2 py-1 text-left">Before</th><th className="px-2 py-1 text-left">Keyword now</th><th className="px-2 py-1 text-right">Searches</th></tr></thead>
                            <tbody>{r.changes.map((c: any, i: number) => <tr key={i} className="border-t border-gray-100"><td className="px-2 py-1">{c.page}</td><td className="px-2 py-1">{c.city}</td><td className="px-2 py-1 text-gray-400">{c.from || 'none'}</td><td className="px-2 py-1 font-medium">{c.to}</td><td className="px-2 py-1 text-right">{c.volume ?? '-'}</td></tr>)}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <RankingsCard cities={cities} />

      {conflicts.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="mb-2 font-semibold">{conflicts.length} phrases are wanted by two pages (the first page keeps it)</p>
          <ul className="list-disc space-y-1 pl-5">{conflicts.slice(0, 20).map((c, i) => <li key={i}><b>{c.keyword}</b>: kept by {c.owner}; also wanted by {c.wanted}. Change the keyword on the second page in Auto Pages, Step 4.</li>)}</ul>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">Paste volumes from Google Keyword Planner (optional)</h2>
        <p className="mb-3 text-sm text-gray-500">One phrase per line, then a comma or tab, then the monthly searches. A Keyword Planner export pasted as it is works.</p>
        <textarea className="w-full p-2.5 text-sm" rows={4} placeholder={'photo booth rental hyderabad, 1300\n360 photo booth vizag, 90'} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <Button className="mt-2" variant="outline" disabled={!csv.trim() || !!busy} onClick={() => run('import', { text: csv }).then(() => setCsv(''))}>Import</Button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-bold text-gray-900">Keyword list ({total})</h2>
          <select className="p-2 text-sm" value={city} onChange={(e) => { setPage(0); setCity(e.target.value); }}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}
          </select>
          <select className="p-2 text-sm" value={owner} onChange={(e) => { setPage(0); setOwner(e.target.value as any); }}>
            <option value="all">All phrases</option>
            <option value="owned">Has an owner page</option>
            <option value="free">Free (no owner yet)</option>
          </select>
          <Input className="max-w-xs" placeholder="Search phrases" value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="text-sm">
            <thead><tr><th className="px-3 py-2 text-left">Phrase</th><th className="px-3 py-2 text-left">City</th><th className="px-3 py-2 text-right">Searches / month</th><th className="px-3 py-2 text-left">Owner page</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{r.keyword}</td>
                  <td className="px-3 py-2 text-gray-500">{r.city_slug || ''}</td>
                  <td className="px-3 py-2 text-right">
                    <input defaultValue={r.volume ?? ''} className="w-24 px-2 py-1 text-right text-sm" placeholder="?" onBlur={(e) => { const v = e.target.value.trim(); if (v !== String(r.volume ?? '')) adminApi('/api/admin/keywords', { action: 'update', id: r.id, fields: { volume: v === '' ? null : Number(v) } }).then(() => toast.success('Saved')).catch((er) => toast.error(er.message)); }} />
                  </td>
                  <td className="px-3 py-2">{r.owner_url ? <a className="font-medium text-orange-700 hover:underline" href={r.owner_url} target="_blank" rel="noopener noreferrer">{r.owner_url}</a> : <span className="text-gray-400">free</span>}</td>
                  <td className="px-3 py-2 text-gray-500">{r.intent === 'info' ? 'Guide / blog' : r.intent === 'buy' ? 'Rent / book' : ''}</td>
                  <td className="px-3 py-2 text-right">{r.owner_type === 'none' && <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => adminApi('/api/admin/keywords', { action: 'delete', id: r.id }).then(load).catch((er) => toast.error(er.message))}>Remove</button>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Nothing here yet. Press step 1 and step 2 above.</td></tr>}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>Page {page + 1} of {pages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </section>
    </div>
  );
}
