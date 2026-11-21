'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';
import { EVENT_TYPES } from '@/lib/case-studies';

type Photo = { url: string; alt: string; caption: string; note?: string };
const blank = {
  title: '', city_slug: '', area: '', event_type: '', event_date: '', guests: '', product_slugs: [] as string[], notes: '', story: '',
  photos: [{ url: '', alt: '', caption: '', note: '' }] as Photo[],
  quote_text: '', quote_name: '', quote_role: '', quote_approved: false, client_name: '', meta_title: '', meta_description: '', focus_keyword: '',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
const cnt = (v: string, lo: number, hi: number) => <span className={`text-xs ${v.length >= lo && v.length <= hi ? 'text-green-600' : 'text-amber-600'}`}>{v.length} characters (aim for {lo}-{hi})</span>;

export default function CaseStudiesAdmin() {
  const [opts, setOpts] = useState<any>({ cities: [], products: [], ready: true });
  const [items, setItems] = useState<any[]>([]);
  const [id, setId] = useState('');
  const [f, setF] = useState<any>(blank);
  const [status, setStatus] = useState('draft');
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('');
  const [warn, setWarn] = useState('');
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [bulk, setBulk] = useState('');

  const loadList = useCallback(async () => { try { const r = await adminApi('/api/admin/case-studies', { action: 'list' }); setItems(r.items || []); } catch (e: any) { toast.error(e.message); } }, []);
  useEffect(() => { adminApi('/api/admin/case-studies', { action: 'options' }).then(setOpts).catch((e) => toast.error(e.message)); loadList(); }, [loadList]);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const setPhoto = (i: number, k: keyof Photo, v: string) => setF((p: any) => ({ ...p, photos: p.photos.map((x: Photo, j: number) => (j === i ? { ...x, [k]: v } : x)) }));

  async function openItem(itemId: string) {
    try {
      const r = await adminApi('/api/admin/case-studies', { action: 'get', id: itemId });
      const c = r.item;
      setId(c.id); setStatus(c.status); setWarn('');
      setF({ ...blank, ...c, city_slug: c.city_slug || '', area: c.area || '', event_type: c.event_type || '', event_date: c.event_date || '', guests: c.guests || '', notes: c.notes || '', story: c.story || '', quote_text: c.quote_text || '', quote_name: c.quote_name || '', quote_role: c.quote_role || '', client_name: c.client_name || '', meta_title: c.meta_title || '', meta_description: c.meta_description || '', focus_keyword: c.focus_keyword || '', photos: (c.photos || []).length ? c.photos.map((p: any) => ({ ...p, note: '' })) : blank.photos });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { toast.error(e.message); }
  }
  function reset() { setId(''); setStatus('draft'); setF(blank); setWarn(''); }

  async function save(quiet = false) {
    setBusy('save');
    try { const r = await adminApi('/api/admin/case-studies', { action: 'save', id: id || undefined, fields: f }); setId(r.id); if (!quiet) toast.success('Saved as a draft. It is not public yet.'); await loadList(); return r.id as string; } catch (e: any) { toast.error(e.message); return ''; } finally { setBusy(''); }
  }

  async function suggestTitles() {
    setBusy('titles'); setTitleOptions([]);
    try {
      const r = await adminApi('/api/admin/case-studies', { action: 'titles', fields: { ...f, photos: f.photos.filter((p: Photo) => p.url).map((p: Photo) => ({ url: p.url, note: p.note || p.alt })) } });
      setTitleOptions(r.titles || []);
      if (!(r.titles || []).length) toast.error('No usable titles came back. Add the event type, city and a few notes, then try again.');
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const movePhoto = (i: number, to: number) => setF((p: any) => {
    if (to < 0 || to >= p.photos.length) return p;
    const next = [...p.photos]; const [x] = next.splice(i, 1); next.splice(to, 0, x);
    return { ...p, photos: next };
  });

  function addBulk() {
    const add: Photo[] = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => { const [u, ...n] = l.split('|'); return { url: u.trim(), alt: '', caption: '', note: n.join('|').trim() }; }).filter((x) => /^https:\/\//i.test(x.url));
    if (!add.length) { toast.error('Paste links that start with https://'); return; }
    setF((p: any) => ({ ...p, photos: [...p.photos.filter((x: Photo) => x.url), ...add] }));
    setBulk('');
    toast.success(`${add.length} pictures added`);
  }

  async function tidy() {
    setBusy('tidy'); setWarn('');
    try {
      const r = await adminApi('/api/admin/case-studies', { action: 'tidy', fields: { ...f, photos: f.photos.filter((p: Photo) => p.url).map((p: Photo) => ({ url: p.url, note: p.note || p.alt })) } });
      setF((p: any) => ({ ...p, title: p.title || r.title, story: r.story, meta_title: r.meta_title, meta_description: r.meta_description, focus_keyword: r.focus_keyword, photos: p.photos.filter((x: Photo) => x.url).map((x: Photo, i: number) => ({ ...x, alt: r.photos[i]?.alt || x.alt, caption: r.photos[i]?.caption || x.caption })) }));
      if (r.warning) setWarn(r.warning);
      toast.success(r.imagesSeen ? 'Tidied. Please read it: only your facts are used.' : 'Tidied (the AI could not open a picture link, so picture text may be basic).');
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function publish() {
    const sid = await save(true);
    if (!sid) return;
    setBusy('publish');
    try { await adminApi('/api/admin/case-studies', { action: 'publish', id: sid }); toast.success('Published. It shows on the site within about 5 minutes.'); setStatus('published'); await loadList(); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }
  async function unpublish() { try { await adminApi('/api/admin/case-studies', { action: 'unpublish', id }); setStatus('draft'); toast.success('Back to draft'); await loadList(); } catch (e: any) { toast.error(e.message); } }
  async function remove() { if (!window.confirm('Delete this case study?')) return; try { await adminApi('/api/admin/case-studies', { action: 'delete', id }); toast.success('Deleted'); reset(); await loadList(); } catch (e: any) { toast.error(e.message); } }

  const shownProducts = opts.products.filter((p: any) => !filter || String(p.title).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      {!opts.ready && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">One setup step first</p>
          <p className="mt-1">Run <b>AUTO_PAGES_STEP7.sql</b> in Supabase (SQL Editor), then reload this page.</p>
        </div>
      )}

      {items.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Your case studies ({items.length})</h2><Button size="sm" variant="outline" onClick={reset}>+ New case study</Button></div>
          <div className="space-y-2">
            {items.map((c) => (
              <button key={c.id} onClick={() => openItem(c.id)} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm ${id === c.id ? 'border-orange-400 bg-orange-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <span className="font-semibold text-gray-900">{c.title}</span>
                <span className="text-xs"><span className={`rounded-full px-2 py-0.5 font-semibold ${c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{c.status === 'published' ? 'Live' : 'Draft (hidden)'}</span> <span className="text-gray-400">{c.city_slug || ''} {c.event_type ? `· ${c.event_type}` : ''}</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-gray-900">{id ? 'Edit case study' : 'Add a case study'}</h2>
        <p className="mb-4 text-sm text-gray-500">Only real events. Nothing is public until you press Publish. Everything stays hidden until you publish your first one.</p>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" hint="For example: Photo booth and games at a corporate annual day in Hyderabad. Press Suggest titles for 5 options based on your notes, city, products and pictures.">
              <div className="flex gap-2"><Input value={f.title} onChange={(e) => set('title', e.target.value)} /><Button type="button" variant="outline" onClick={suggestTitles} disabled={!!busy}>{busy === 'titles' ? '...' : 'Suggest titles'}</Button></div>
              {titleOptions.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {titleOptions.map((t) => <button key={t} type="button" onClick={() => { set('title', t); setTitleOptions([]); }} className="rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-800 hover:border-orange-400 hover:bg-orange-50">{t} <span className="text-xs text-gray-400">({t.length})</span></button>)}
                </div>
              )}
            </Field>
            <Field label="Event type"><select className="w-full p-2.5 text-sm" value={f.event_type} onChange={(e) => set('event_type', e.target.value)}><option value="">Choose</option>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="City"><select className="w-full p-2.5 text-sm" value={f.city_slug} onChange={(e) => set('city_slug', e.target.value)}><option value="">Choose</option>{opts.cities.map((c: any) => <option key={c.slug} value={c.slug}>{c.city}</option>)}</select></Field>
            <Field label="Area" hint="Optional, e.g. Rushikonda"><Input value={f.area} onChange={(e) => set('area', e.target.value)} /></Field>
            <Field label="Event date"><input type="date" className="w-full p-2.5 text-sm" value={f.event_date} onChange={(e) => set('event_date', e.target.value)} /></Field>
            <Field label="Guests" hint="Only if you know, e.g. about 300"><Input value={f.guests} onChange={(e) => set('guests', e.target.value)} /></Field>
          </div>

          <Field label="Products you used" hint="Tick every product from this event. They become links on the page.">
            <Input placeholder="Filter products" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <div className="grid max-h-48 gap-1 overflow-auto rounded-xl border border-gray-200 p-2 sm:grid-cols-2">
              {shownProducts.map((p: any) => (
                <label key={p.slug} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
                  <input type="checkbox" checked={f.product_slugs.includes(p.slug)} onChange={(e) => set('product_slugs', e.target.checked ? [...f.product_slugs, p.slug] : f.product_slugs.filter((x: string) => x !== p.slug))} />
                  {String(p.title).trim()}
                </label>
              ))}
            </div>
          </Field>

          <Field label="What happened (your notes)" hint="Bullet points are fine. Real facts only: what you set up, what guests did, anything memorable. The AI never adds details you did not write.">
            <textarea className="w-full p-2.5 text-sm" rows={5} value={f.notes} placeholder={'Annual day for a software company, about 300 staff\nSet up 360 booth and arcade games near the entrance\nQueue for the booth all evening'} onChange={(e) => set('notes', e.target.value)} />
          </Field>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700">Pictures (Cloudinary links)</p>
            <p className="mb-2 text-xs text-gray-400">Paste a link and a few words on what it shows. The first picture is the big cover at the top, so use Make cover or the arrows to choose it and set the order. Any number of pictures works. Alt text and captions are filled in by &quot;Tidy with AI&quot; (it looks at the picture).</p>
            <div className="mb-3 rounded-xl border border-dashed border-gray-300 p-3">
              <p className="mb-1 text-xs font-semibold text-gray-600">Paste many links at once (one per line, optional: link | what it shows)</p>
              <textarea className="w-full p-2 font-mono text-xs" rows={3} value={bulk} onChange={(e) => setBulk(e.target.value)} />
              <button type="button" className="mt-1 text-sm font-medium text-orange-700 hover:underline" onClick={addBulk}>Add these pictures</button>
            </div>
            <div className="space-y-2">
              {f.photos.map((p: Photo, i: number) => (
                <div key={i} className="grid gap-2 rounded-xl bg-gray-50 p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                  <Input placeholder="https://res.cloudinary.com/..." value={p.url} onChange={(e) => setPhoto(i, 'url', e.target.value)} />
                  <Input placeholder="What it shows (your note)" value={p.note || ''} onChange={(e) => setPhoto(i, 'note', e.target.value)} />
                  <Input placeholder="Alt text" value={p.alt} onChange={(e) => setPhoto(i, 'alt', e.target.value)} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
                    {i === 0 ? <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">Cover</span> : <button type="button" className="text-orange-700 hover:underline" onClick={() => movePhoto(i, 0)}>Make cover</button>}
                    <button type="button" className="text-gray-600 hover:underline disabled:opacity-30" disabled={i === 0} onClick={() => movePhoto(i, i - 1)}>Up</button>
                    <button type="button" className="text-gray-600 hover:underline disabled:opacity-30" disabled={i === f.photos.length - 1} onClick={() => movePhoto(i, i + 1)}>Down</button>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => set('photos', f.photos.filter((_: Photo, j: number) => j !== i))}>Remove</button>
                  </div>
                  <div className="md:col-span-4"><Input placeholder="Caption (optional)" value={p.caption} onChange={(e) => setPhoto(i, 'caption', e.target.value)} /></div>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm font-medium text-orange-700 hover:underline" onClick={() => set('photos', [...f.photos, { url: '', alt: '', caption: '', note: '' }])}>+ Add another picture</button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={tidy} disabled={!!busy || !opts.ready}>{busy === 'tidy' ? 'Working...' : 'Tidy with AI (story, picture text, Google text)'}</Button>
            <span className="text-xs text-gray-500">Reads your notes and pictures. About 5 to 10 cents.</span>
          </div>
          {warn && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{warn}</div>}

          <Field label="The story shown on the page" hint="Edit freely. A blank line starts a new paragraph.">
            <textarea className="w-full p-2.5 text-sm" rows={7} value={f.story} onChange={(e) => set('story', e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Google title">{<><Input value={f.meta_title} onChange={(e) => set('meta_title', e.target.value)} />{cnt(f.meta_title, 45, 62)}</>}</Field>
            <Field label="Main keyword"><Input value={f.focus_keyword} placeholder="corporate event entertainment hyderabad" onChange={(e) => set('focus_keyword', e.target.value)} /></Field>
          </div>
          <Field label="Google description">{<><textarea className="w-full p-2.5 text-sm" rows={2} value={f.meta_description} onChange={(e) => set('meta_description', e.target.value)} />{cnt(f.meta_description, 120, 155)}</>}</Field>

          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900">Client quote (optional)</p>
            <p className="mb-2 text-xs text-gray-500">Use only a real quote, and only with the client&apos;s permission. It is hidden unless you tick the box.</p>
            <div className="space-y-2">
              <textarea className="w-full p-2.5 text-sm" rows={2} placeholder="The quote, in their own words" value={f.quote_text} onChange={(e) => set('quote_text', e.target.value)} />
              <div className="grid gap-2 md:grid-cols-3">
                <Input placeholder="Name" value={f.quote_name} onChange={(e) => set('quote_name', e.target.value)} />
                <Input placeholder="Role, e.g. HR manager" value={f.quote_role} onChange={(e) => set('quote_role', e.target.value)} />
                <Input placeholder="Company (shown only if approved)" value={f.client_name} onChange={(e) => set('client_name', e.target.value)} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={!!f.quote_approved} onChange={(e) => set('quote_approved', e.target.checked)} /> The client has approved showing this quote and name</label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => save()} disabled={!!busy}>{busy === 'save' ? 'Saving...' : 'Save draft'}</Button>
            {status !== 'published' ? <Button onClick={publish} disabled={!!busy}>{busy === 'publish' ? 'Publishing...' : 'Publish'}</Button> : <Button variant="outline" onClick={unpublish}>Take offline</Button>}
            {id && <Button variant="outline" onClick={remove}>Delete</Button>}
          </div>
        </div>
      </section>
    </div>
  );
}
