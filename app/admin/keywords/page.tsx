'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';
import { supabase } from '@/lib/supabase-client';

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

  const load = useCallback(async () => {
    try {
      const r = await adminApi('/api/admin/keywords', { action: 'list', city: city || undefined, owner, q: q || undefined, page });
      setRows(r.rows || []); setTotal(r.total || 0); setDfs(!!r.dataForSeo); setNoVol(r.withoutVolume || 0); setNeedsSql(false);
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
      const r = await adminApi('/api/admin/keywords', { action, ...extra });
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
