'use client';

import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

type City = any;
type Draft = any;

async function api(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}`, ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

const blank = { id: '', city: '', slug: '', state: '', alias: '', areas: '', venues: '', nearby: '', local_notes: '', geo_lat: '', geo_lng: '', is_active: false };

export default function AutoPagesAdmin() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState('');
  const [form, setForm] = useState<any>(blank);
  const [preview, setPreview] = useState<any>(null);
  const [includeUpgrades, setIncludeUpgrades] = useState(false);
  const [busy, setBusy] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [open, setOpen] = useState<string>('');
  const [published, setPublished] = useState<any[]>([]);
  const [pubFilter, setPubFilter] = useState<'all' | 'city_page' | 'service_city' | 'product_city'>('all');
  const [pubSearch, setPubSearch] = useState('');
  const [pubCity, setPubCity] = useState('');
  const [pubSort, setPubSort] = useState<'name' | 'today' | 'total'>('name');
  const [viewsReady, setViewsReady] = useState(true);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [editUrl, setEditUrl] = useState('');
  const [status, setStatus] = useState<Record<string, number>>({});
  const [checking, setChecking] = useState(false);

  const loadCities = useCallback(async () => {
    try { setCities((await api('/api/admin/city-profile')).cities || []); } catch (e: any) { toast.error(e.message); }
  }, []);
  const loadDrafts = useCallback(async () => {
    try { setDrafts((await api('/api/admin/page-drafts')).drafts || []); } catch (e: any) { toast.error(e.message); }
  }, []);
  const loadPublished = useCallback(async () => {
    try { const r = await api('/api/admin/published-pages'); setPublished(r.pages || []); setViewsReady(r.viewsReady !== false); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { loadCities(); loadDrafts(); loadPublished(); }, [loadCities, loadDrafts, loadPublished]);

  async function checkLive(only?: string[]) {
    const urls = only || published.map((p) => p.url);
    setChecking(true);
    try {
      for (let i = 0; i < urls.length; i += 40) {
        const r = await api('/api/admin/check-pages', { method: 'POST', body: JSON.stringify({ urls: urls.slice(i, i + 40) }) });
        setStatus((prev) => ({ ...prev, ...r.results }));
      }
    } catch (e: any) { toast.error(e.message); }
    setChecking(false);
  }

  const pickCity = (id: string) => {
    setCityId(id); setPreview(null);
    const c = cities.find((x) => x.id === id);
    setForm(c ? { ...blank, ...c, areas: (c.areas || []).join(', '), venues: (c.venues || []).join(', '), nearby: (c.nearby || []).join(', '), local_notes: c.local_notes || '', alias: c.alias || '', state: c.state || '', geo_lat: c.geo_lat ?? '', geo_lng: c.geo_lng ?? '' } : blank);
  };

  async function saveCity() {
    setBusy('city');
    try { await api('/api/admin/city-profile', { method: 'POST', body: JSON.stringify(form) }); toast.success('City saved'); await loadCities(); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function runPreview() {
    setBusy('preview');
    try { setPreview(await api('/api/admin/generate-pages', { method: 'POST', body: JSON.stringify({ action: 'preview', cityId: cityId || undefined, includeUpgrades }) })); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function generateAll() {
    setBusy('generate');
    let made = 0; const problems: string[] = []; const skip: string[] = [];
    try {
      for (let guard = 0; guard < 200; guard++) {
        const r = await api('/api/admin/generate-pages', { method: 'POST', body: JSON.stringify({ action: 'generate', cityId: cityId || undefined, includeUpgrades, limit: 6, skip }) });
        made += r.done; (r.failed || []).forEach((f: any) => { problems.push(`${f.label}: ${f.error}`); skip.push(f.label); });
        toast.message(`${made} drafts written…`);
        if (!r.done && !(r.failed || []).length) break;
        if (!r.remaining) break;
      }
      setSkipped(problems);
      toast.success(`${made} drafts ready for review${problems.length ? `, ${problems.length} skipped (reasons shown below)` : ''}`);
      if (problems.length) console.warn(problems);
    } catch (e: any) { toast.error(e.message); }
    setBusy(''); runPreview(); loadDrafts();
  }

  async function act(action: string, d: Draft[]) {
    const byKind: Record<string, string[]> = {};
    d.forEach((x) => (byKind[x.kind] ||= []).push(x.id));
    try {
      for (const kind of Object.keys(byKind)) await api('/api/admin/page-drafts', { method: 'POST', body: JSON.stringify({ action, kind, ids: byKind[kind] }) });
      toast.success(action === 'publish' ? `${d.length} published` : `${d.length} removed`);
      loadDrafts(); loadPublished();
    } catch (e: any) { toast.error(e.message); }
  }

  async function savePublished(p: any, fields: any) {
    try {
      await api('/api/admin/page-drafts', { method: 'POST', body: JSON.stringify({ action: 'edit', kind: p.kind, id: p.id, fields }) });
      toast.success('Saved. The live page updates within about 5 minutes.');
      setEditUrl('');
      loadPublished();
    } catch (e: any) { toast.error(e.message); }
  }

  async function saveEdit(d: Draft, fields: any) {
    try { await api('/api/admin/page-drafts', { method: 'POST', body: JSON.stringify({ action: 'edit', kind: d.kind, id: d.id, fields }) }); toast.success('Saved'); loadDrafts(); } catch (e: any) { toast.error(e.message); }
  }

  const title = (d: Draft) => d.kind === 'city_page' ? `${d.locations?.city} city page${d.city_live ? '' : ' (turn on "City is live" above so it shows)'}` : d.kind === 'product_city' ? `${d.events?.title} in ${d.locations?.city}` : `${d.services?.title} in ${d.locations?.city}`;
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const cityName = cityId ? cities.find((c) => c.id === cityId)?.city : null;
  const kindLabel = (d: Draft) => (d.kind === 'city_page' ? 'City page' : d.kind === 'service_city' ? 'Service page' : 'Product page');

  return (
    <div className="space-y-6">
      {/* ---------- Step 1 ---------- */}
      <StepCard n={1} title="Choose or add a city" hint="The writer only uses what you enter here, so the more real local detail you add, the better and more unique the pages.">
        <Field label="City">
          <select className="w-full p-2.5 text-sm" value={cityId} onChange={(e) => pickCity(e.target.value)}>
            <option value="">+ Add a new city</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.city}{c.is_active ? '' : ' (not live yet)'}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="City name"><Input placeholder="Visakhapatnam" value={form.city} onChange={set('city')} /></Field>
          <Field label="State"><Input placeholder="Andhra Pradesh" value={form.state} onChange={set('state')} /></Field>
          <Field label="Nickname people search" hint="Optional, e.g. Vizag"><Input placeholder="Vizag" value={form.alias} onChange={set('alias')} /></Field>
        </div>
        <Field label="Areas" hint="Separate with commas. Pick real neighbourhoods where events happen."><Input placeholder="Beach Road, Rushikonda, Madhurawada" value={form.areas} onChange={set('areas')} /></Field>
        <Field label="Typical venues" hint="Separate with commas."><Input placeholder="Beach resorts, convention halls, college campuses" value={form.venues} onChange={set('venues')} /></Field>
        <Field label="Nearby towns" hint="Optional."><Input placeholder="Vizianagaram, Anakapalle" value={form.nearby} onChange={set('nearby')} /></Field>
        <Field label="Local notes" hint="Facts only: festivals, seasons, popular event types. Never write where your stock comes from.">
          <textarea className="w-full p-2.5 text-sm" rows={3} placeholder="Peak wedding season is Nov to Feb. Many corporate offsites near Rushikonda beach." value={form.local_notes} onChange={set('local_notes')} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Latitude" hint="Optional"><Input placeholder="17.6868" value={form.geo_lat} onChange={set('geo_lat')} /></Field>
          <Field label="Longitude" hint="Optional"><Input placeholder="83.2185" value={form.geo_lng} onChange={set('geo_lng')} /></Field>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium">
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              City is live on the website
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveCity} disabled={busy === 'city'}>{busy === 'city' ? 'Saving...' : 'Save city'}</Button>
          <span className="text-xs text-gray-500">Saving does not publish any page.</span>
        </div>
      </StepCard>

      {/* ---------- Step 2 ---------- */}
      <StepCard n={2} title="See what is missing, then write drafts" hint={`Works on ${cityName ? cityName : 'all live cities'}. Products come from each service's "Related Events" list. Nothing is public yet.`}>
        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
          <input type="checkbox" className="mt-0.5" checked={includeUpgrades} onChange={(e) => setIncludeUpgrades(e.target.checked)} />
          <span><b>Also improve pages that are already live.</b> The new text is saved as a draft and the live page keeps its old text until you publish it.</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={runPreview} disabled={!!busy}>{busy === 'preview' ? 'Checking...' : '1. Preview (free)'}</Button>
          <Button onClick={generateAll} disabled={!!busy || !preview || !preview.total}>{busy === 'generate' ? 'Writing, please keep this page open...' : `2. Write ${preview?.total ?? 0} drafts`}</Button>
        </div>
        {skipped.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="mb-2 font-semibold">{skipped.length} pages were skipped. Here is why:</p>
            <ul className="list-disc space-y-1 pl-5">{skipped.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="mt-2 text-xs">Click Write again to retry them. Skipped pages are never published by accident.</p>
          </div>
        )}
        {preview && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat n={preview.total} label="Total" strong />
              <Stat n={preview.cityPages} label="City pages" />
              <Stat n={preview.newServicePages} label="Service pages" />
              <Stat n={preview.newProductPages} label="New product pages" />
              <Stat n={preview.upgrades} label="Text upgrades" />
            </div>
            {preview.total === 0 ? (
              <p className="mt-3 text-sm text-green-700">Everything is already created for this selection.</p>
            ) : (
              <details className="mt-3 text-sm text-gray-600">
                <summary className="cursor-pointer font-medium text-gray-800">Show the first {preview.sample.length} pages</summary>
                <ul className="mt-2 list-disc space-y-0.5 pl-5">{preview.sample.map((s: string) => <li key={s}>{s}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </StepCard>

      {/* ---------- Step 3 ---------- */}
      <StepCard n={3} title={`Review and publish (${drafts.length} waiting)`} hint="Click a row to read and edit it. Publish makes it live within about 5 minutes. Delete removes the draft only; live pages are never touched.">
        {drafts.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => window.confirm(`Publish all ${drafts.length}?`) && act('publish', drafts)}>Publish all {drafts.length}</Button>
            <Button variant="outline" onClick={() => window.confirm('Delete all drafts? Live pages are not affected.') && act('reject', drafts)}>Delete all drafts</Button>
          </div>
        )}
        <div className="space-y-2">
          {drafts.map((d) => (
            <DraftRow key={`${d.kind}${d.id}`} d={d} title={title(d)} kind={kindLabel(d)} open={open === d.id} toggle={() => setOpen(open === d.id ? '' : d.id)} onPublish={() => act('publish', [d])} onReject={() => act('reject', [d])} onSave={(f: any) => saveEdit(d, f)} />
          ))}
        </div>
        {!drafts.length && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No drafts waiting. Do step 2 first, and the pages appear here for your approval.
          </div>
        )}
      </StepCard>

      {/* ---------- Step 4 ---------- */}
      <StepCard n={4} title={`Published pages (${published.length})`} hint="Every page Auto Pages has made live. Click 'Check all are live' to test each address on the real website. A new page can take up to 5 minutes to appear.">
        {(() => {
          const shown = published.filter((p) => (pubFilter === 'all' || p.kind === pubFilter) && (!pubCity || p.city === pubCity) && (!pubSearch || (p.name + ' ' + p.url).toLowerCase().includes(pubSearch.toLowerCase())));
          if (pubSort === 'today') shown.sort((a, b) => (b.today || 0) - (a.today || 0) || (b.total || 0) - (a.total || 0));
          else if (pubSort === 'total') shown.sort((a, b) => (b.total || 0) - (a.total || 0));
          const sumToday = published.reduce((n, p) => n + (p.today || 0), 0);
          const sumTotal = published.reduce((n, p) => n + (p.total || 0), 0);
          const checked = published.filter((p) => status[p.url] !== undefined);
          const live = checked.filter((p) => status[p.url] === 200).length;
          const notLive = checked.length - live;
          const counts = { city_page: 0, service_city: 0, product_city: 0 } as Record<string, number>;
          published.forEach((p) => (counts[p.kind] = (counts[p.kind] || 0) + 1));
          return (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat n={published.length} label="Published in total" strong />
                <Stat n={counts.city_page} label="City pages" />
                <Stat n={counts.service_city} label="Service pages" />
                <Stat n={counts.product_city} label="Product pages" />
                <Stat n={sumToday} label="Views today" />
                <Stat n={sumTotal} label="Views, all time" />
              </div>
              {!viewsReady && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Page views are not switched on yet. Run AUTO_PAGES_STEP3.sql in Supabase (SQL Editor), then press Refresh list. Counting starts from that moment.</div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => checkLive()} disabled={checking || !published.length}>{checking ? 'Checking, please wait...' : 'Check all are live'}</Button>
                <Button variant="outline" onClick={loadPublished}>Refresh list</Button>
                {checked.length > 0 && (
                  <span className="text-sm">
                    <b className="text-green-700">{live} live</b>
                    {notLive > 0 && <> , <b className="text-amber-700">{notLive} not live yet</b></>}
                    {' '}of {checked.length} checked
                  </span>
                )}
              </div>
              {notLive > 0 && !checking && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Pages published in the last few minutes may still show "not live yet". Wait 5 minutes and check again. If one stays that way, tick "City is live" for its city in step 1, and make sure the service lists the product under "Related Events".
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {([['all', 'All'], ['city_page', 'City pages'], ['service_city', 'Service pages'], ['product_city', 'Product pages']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setPubFilter(k)} className={`rounded-full border px-3 py-1 text-sm ${pubFilter === k ? 'border-orange-500 bg-orange-50 font-semibold text-orange-700' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                ))}
                <select className="p-2 text-sm" value={pubSort} onChange={(e) => setPubSort(e.target.value as any)}>
                  <option value="name">Sort: default</option>
                  <option value="today">Sort: most views today</option>
                  <option value="total">Sort: most views, all time</option>
                </select>
                <select className="p-2 text-sm" value={pubCity} onChange={(e) => setPubCity(e.target.value)}>
                  <option value="">All cities</option>
                  {Array.from(new Set(published.map((p) => p.city))).sort().map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input className="max-w-xs" placeholder="Search by name or address" value={pubSearch} onChange={(e) => setPubSearch(e.target.value)} />
              </div>
              <div className="max-h-[480px] overflow-auto rounded-xl border border-gray-200">
                <table className="text-sm">
                  <thead><tr><th className="px-3 py-2 text-left">Page</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-right">Views today</th><th className="px-3 py-2 text-right">Views total</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Open</th><th className="px-3 py-2 text-left">Edit</th></tr></thead>
                  <tbody>
                    {shown.map((p) => {
                      const st = status[p.url];
                      return (
                        <Fragment key={p.url}>
                        <tr className="border-t border-gray-100">
                          <td className="px-3 py-2"><div className="font-medium text-gray-900">{p.name}</div>{p.note && <div className="text-xs text-amber-700">{p.note}</div>}</td>
                          <td className="px-3 py-2 text-gray-500">{p.kind === 'city_page' ? 'City' : p.kind === 'service_city' ? 'Service' : 'Product'}</td>
                          <td className="px-3 py-2 text-right font-semibold">{p.today || 0}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{p.total || 0}</td>
                          <td className="px-3 py-2">
                            {st === undefined ? <span className="text-gray-400">Not checked</span> : st === 200 ? <span className="font-semibold text-green-700">Live</span> : <span className="font-semibold text-amber-700">Not live yet ({st || 'no answer'})</span>}
                          </td>
                          <td className="px-3 py-2"><a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-700 hover:underline">Open page</a></td>
                          <td className="px-3 py-2"><button className="font-medium text-orange-700 hover:underline" onClick={() => setEditUrl(editUrl === p.url ? '' : p.url)}>{editUrl === p.url ? 'Close' : 'Edit'}</button></td>
                        </tr>
                        {editUrl === p.url && (
                          <tr className="border-t border-gray-100 bg-white">
                            <td colSpan={7} className="px-4 py-4">
                              <PageEditor d={p} url={p.url} onSave={(f: any) => savePublished(p, f)} saveLabel="Save changes to this live page" />
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                    {!shown.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">{published.length ? 'Nothing matches your search.' : 'No pages published through Auto Pages yet.'}</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </StepCard>
    </div>
  );
}

function StepCard({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Stat({ n, label, strong }: { n: number; label: string; strong?: boolean }) {
  return (
    <div className={`rounded-lg bg-white p-3 text-center ${strong ? 'ring-1 ring-orange-200' : ''}`}>
      <p className={`text-2xl font-bold ${strong ? 'text-orange-600' : 'text-gray-900'}`}>{n ?? 0}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

/** Edit everything about one page: keyword, Google title and description, page text, questions. Shared by drafts and published pages. */
function PageEditor({ d, url, onSave, saveLabel }: { d: any; url?: string; onSave: (fields: any) => void; saveLabel: string }) {
  const [f, setF] = useState({
    focus_keyword: d.focus_keyword || '',
    meta_title: d.meta_title || '',
    meta_description: d.meta_description || '',
    intro: d.intro || '',
    faqs: (Array.isArray(d.faqs) ? d.faqs : []).map((x: any) => ({ q: x.q || '', a: x.a || '' })),
  });
  const count = (v: string, lo: number, hi: number) => <span className={`text-xs ${v.length >= lo && v.length <= hi ? 'text-green-600' : 'text-amber-600'}`}>{v.length} characters (aim for {lo}-{hi})</span>;
  const kw = f.focus_keyword.trim().toLowerCase();
  const inTitle = !!kw && f.meta_title.toLowerCase().includes(kw);
  const inText = !!kw && f.intro.toLowerCase().includes(kw);
  const setFaq = (i: number, k: 'q' | 'a', v: string) => setF({ ...f, faqs: f.faqs.map((x: any, j: number) => (j === i ? { ...x, [k]: v } : x)) });
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">How it may look on Google</p>
        <p className="truncate text-[17px] leading-snug text-blue-700">{f.meta_title || 'Page title'}</p>
        <p className="truncate text-xs text-green-700">{url || 'www.retreatarcade.in'}</p>
        <p className="mt-0.5 text-[13px] text-gray-600">{f.meta_description || 'Description'}</p>
      </div>
      <Field label="Main keyword" hint="The phrase people type into Google to find this page. Google reads your title, headings and text, so use this phrase in them.">
        <Input value={f.focus_keyword} placeholder="photo booth rental visakhapatnam" onChange={(e) => setF({ ...f, focus_keyword: e.target.value })} />
        {kw && (
          <p className="text-xs">
            <span className={inTitle ? 'text-green-600' : 'text-amber-600'}>{inTitle ? 'In the title' : 'Not in the title'}</span>
            {' · '}
            <span className={inText ? 'text-green-600' : 'text-amber-600'}>{inText ? 'In the page text' : 'Not in the page text'}</span>
          </p>
        )}
      </Field>
      <Field label="Page title (shown on Google)"><Input value={f.meta_title} onChange={(e) => setF({ ...f, meta_title: e.target.value })} />{count(f.meta_title, 45, 62)}</Field>
      <Field label="Description (shown on Google)"><textarea className="w-full p-2.5" rows={2} value={f.meta_description} onChange={(e) => setF({ ...f, meta_description: e.target.value })} />{count(f.meta_description, 120, 155)}</Field>
      <Field label="Text on the page" hint="Leave a blank line between paragraphs."><textarea className="w-full p-2.5" rows={9} value={f.intro} onChange={(e) => setF({ ...f, intro: e.target.value })} /></Field>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-700">Questions and answers (shown on the page)</p>
        <div className="space-y-3">
          {f.faqs.map((q: any, i: number) => (
            <div key={i} className="space-y-2 rounded-xl bg-gray-50 p-3">
              <Input value={q.q} placeholder="Question" onChange={(e) => setFaq(i, 'q', e.target.value)} />
              <textarea className="w-full p-2.5" rows={2} value={q.a} placeholder="Answer" onChange={(e) => setFaq(i, 'a', e.target.value)} />
              <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => setF({ ...f, faqs: f.faqs.filter((_: any, j: number) => j !== i) })}>Remove this question</button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm font-medium text-orange-700 hover:underline" onClick={() => setF({ ...f, faqs: [...f.faqs, { q: '', a: '' }] })}>+ Add a question</button>
      </div>
      <Button size="sm" onClick={() => onSave(f)}>{saveLabel}</Button>
    </div>
  );
}

function DraftRow({ d, title, kind, open, toggle, onPublish, onReject, onSave }: any) {
  const upgrade = d.kind !== 'city_page' && d.status !== 'draft';
  const review = String(d.generated_by || '').split('needs review:')[1]?.trim();
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <button className="min-w-0 flex-1 text-left" onClick={toggle}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{kind}</span>
            {review && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Check before publishing</span>}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${upgrade ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{upgrade ? 'Upgrade for a live page' : 'New page, hidden'}</span>
          </div>
          <div className="mt-1 font-semibold text-gray-900">{title}</div>
          <div className="mt-0.5 line-clamp-1 text-sm text-gray-500">{d.meta_title}</div>
        </button>
        <div className="flex gap-2">
          <Button size="sm" onClick={onPublish}>Publish</Button>
          <Button size="sm" variant="outline" onClick={onReject}>Delete</Button>
        </div>
      </div>
      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          {review && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">The writer could not fully meet the quality rules for this page: {review}. Please fix it below, or delete the draft.</div>}
          <PageEditor d={d} onSave={onSave} saveLabel="Save my edits" />
        </div>
      )}
    </div>
  );
}
