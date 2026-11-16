'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';

const STAGE: Record<string, string> = { draft: 'Draft (not public)', published: 'Live, city pages next', cities: 'Writing city pages', done: 'City pages ready' };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
function Num({ n, children, title, hint }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {hint && <p className="text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
const cnt = (v: string, lo: number, hi: number) => <span className={`text-xs ${v.length >= lo && v.length <= hi ? 'text-green-600' : 'text-amber-600'}`}>{v.length} characters (aim for {lo}-{hi})</span>;

export default function ProductAiAdmin() {
  const [opts, setOpts] = useState<any>({ categories: [], services: [], ready: true });
  const [form, setForm] = useState({ name: '', facts: '', price: '', category: '', images: '', featured: false });
  const [launches, setLaunches] = useState<any[]>([]);
  const [openId, setOpenId] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [edit, setEdit] = useState<any>({});
  const [answers, setAnswers] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [onRequest, setOnRequest] = useState(false);
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState('');
  const [last, setLast] = useState<any>(null);

  const loadList = useCallback(async () => {
    try { const r = await adminApi('/api/admin/product-ai', { action: 'list' }); setLaunches(r.launches || []); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => {
    adminApi('/api/admin/product-ai', { action: 'options' }).then(setOpts).catch((e) => toast.error(e.message));
    loadList();
  }, [loadList]);

  const open = useCallback(async (id: string) => {
    setOpenId(id); setAnswers(''); setLast(null);
    try {
      const r = await adminApi('/api/admin/product-ai', { action: 'get', launchId: id });
      setDetail(r);
      const p = r.product || {};
      setEdit({ title: p.title || '', summary: p.summary || '', price: p.price ?? '', meta_title: p.meta_title || '', meta_description: p.meta_description || '', category: p.category || '' });
      setOnRequest(p.price == null && r.launch.stage !== 'draft');
      setPicked(Object.fromEntries((r.launch.service_ids || []).map((x: string) => [x, true])));
    } catch (e: any) { toast.error(e.message); }
  }, []);

  async function generate() {
    setBusy('gen'); setLast(null);
    try {
      const r = await adminApi('/api/admin/product-ai', { action: 'generate', ...form, price: form.price === '' ? null : Number(form.price), images: form.images.split(/\r?\n/) });
      setLast(r);
      toast.success('Draft written. Review it below.');
      setForm({ name: '', facts: '', price: '', category: '', images: '', featured: false });
      await loadList();
      await open(r.launchId);
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function rewrite() {
    if (!detail) return;
    setBusy('rewrite');
    try {
      const old: any = detail.launch.input || {};
      const facts = `${old.facts || ''}${answers.trim() ? `\n\nAnswers from the owner:\n${answers.trim()}` : ''}`;
      await adminApi('/api/admin/product-ai', { action: 'regenerate', launchId: openId, facts });
      toast.success('Rewritten with your answers');
      await open(openId);
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function saveEdits() {
    setBusy('save');
    try { await adminApi('/api/admin/product-ai', { action: 'update', productId: detail.product.id, fields: edit }); toast.success('Saved'); await open(openId); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function publish() {
    const serviceIds = Object.keys(picked).filter((k) => picked[k]);
    if (!window.confirm(`Publish "${edit.title}" now and attach it to ${serviceIds.length} service(s)?`)) return;
    setBusy('publish');
    try {
      await adminApi('/api/admin/product-ai', { action: 'update', productId: detail.product.id, fields: { ...edit } });
      await adminApi('/api/admin/product-ai', { action: 'publish', launchId: openId, serviceIds, priceOnRequest: onRequest });
      toast.success('Published. Now write the city pages.');
      await loadList(); await open(openId);
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function cities() {
    setBusy('cities');
    try {
      let made = 0;
      for (let guard = 0; guard < 40; guard++) {
        const r = await adminApi('/api/admin/product-ai', { action: 'cities', launchId: openId });
        made += r.made;
        setProgress(`${r.doneCount} of ${r.total} city pages written${r.failed?.length ? `, ${r.failed.length} need a retry` : ''}`);
        if (r.done) { toast.success(`All city pages are written as drafts (${made} new)`); break; }
        if (!r.made && r.failed?.length) { toast.error(`Some pages failed: ${r.failed[0].error || 'try again'}`); break; }
        if (!r.remaining) break;
      }
      await loadList(); await open(openId);
    } catch (e: any) { toast.error(e.message); }
    setProgress(''); setBusy('');
  }

  async function approve() {
    if (!window.confirm('Publish all city pages for this product? They go live within about 5 minutes.')) return;
    setBusy('approve');
    try { const r = await adminApi('/api/admin/product-ai', { action: 'approve', launchId: openId }); toast.success(`${r.published} city pages published`); await open(openId); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function discard() {
    if (!window.confirm('Delete this draft product?')) return;
    try { await adminApi('/api/admin/product-ai', { action: 'discard', launchId: openId }); toast.success('Deleted'); setOpenId(''); setDetail(null); await loadList(); } catch (e: any) { toast.error(e.message); }
  }

  const L = detail?.launch;
  const P = detail?.product;
  const stage = L?.stage;
  const draftPages = (detail?.cityPages || []).filter((c: any) => c.status !== 'published');
  const livePages = (detail?.cityPages || []).filter((c: any) => c.status === 'published');

  return (
    <div className="space-y-6">
      {!opts.ready && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">One setup step first</p>
          <p className="mt-1">Run <b>AUTO_PAGES_STEP6.sql</b> in Supabase (SQL Editor), then reload this page.</p>
        </div>
      )}

      <Num n={1} title="Tell the AI about the product" hint="You give the name, a few real facts, your pictures and the price. The AI writes everything else as a draft. Nothing is public yet.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product name"><Input value={form.name} placeholder="Digital Slingshot Game" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Starting price in ₹" hint="Type it only when you are sure. Empty means you will choose 'price on request' later."><Input inputMode="numeric" value={form.price} placeholder="15000" onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, '') })} /></Field>
        </div>
        <Field label="Real facts you know" hint="Size and space needed, power, setup time, guests per hour, what is included, customisation. The AI never invents these: if you leave them out, it will ask you.">
          <textarea className="w-full p-2.5 text-sm" rows={4} value={form.facts} placeholder={'Needs 3 m x 3 m floor space and one power socket. Setup takes about 45 minutes. Up to 80 guests an hour.'} onChange={(e) => setForm({ ...form, facts: e.target.value })} />
        </Field>
        <Field label="Pictures (Cloudinary links)" hint="One per line: the link, then | and what it shows. The first is the main picture, the rest are the gallery. The AI looks at them to write alt text.">
          <textarea className="w-full p-2.5 font-mono text-xs" rows={5} value={form.images} placeholder={'https://res.cloudinary.com/your-name/image/upload/slingshot-main.jpg | the slingshot game set up at an event\nhttps://res.cloudinary.com/your-name/image/upload/slingshot-2.jpg | guests playing'} onChange={(e) => setForm({ ...form, images: e.target.value })} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Category" hint="Leave on 'Let the AI choose' unless you are sure."><select className="w-full p-2.5 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Let the AI choose</option>{opts.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></Field>
          <label className="flex cursor-pointer items-end gap-2 pb-2.5 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Show as a featured product</label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={!!busy || !opts.ready}>{busy === 'gen' ? 'Writing, this takes up to a minute...' : 'Write the product page'}</Button>
          <span className="text-xs text-gray-500">About 10 to 25 cents of AI use. Nothing goes live.</span>
        </div>
        {last?.similar?.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Similar products already exist: {last.similar.map((s: any) => s.title).join(', ')}. Make sure this is not a duplicate.</div>}
      </Num>

      {launches.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-bold text-gray-900">Your products from the AI</h2>
          <div className="space-y-2">
            {launches.map((l) => (
              <button key={l.id} onClick={() => open(l.id)} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm ${openId === l.id ? 'border-orange-400 bg-orange-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <span className="font-semibold text-gray-900">{l.events?.title || 'Product'}</span>
                <span className="text-xs text-gray-500">{STAGE[l.stage] || l.stage}{l.stage === 'cities' || l.stage === 'done' ? ` · ${l.cities_done}/${l.cities_total} city pages` : ''}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {detail && P && (
        <>
          {stage === 'draft' && (
            <Num n={2} title="Review the draft" hint="Read it, answer the AI's questions if you can, fix anything, then choose the services and publish.">
              {(L.questions || []).length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">The AI needs a few real facts it does not have (it left them out instead of guessing)</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{L.questions.map((q: any, i: number) => <li key={i}><b>{q.q}</b> <span className="text-blue-700">({q.why})</span></li>)}</ul>
                  <textarea className="mt-3 w-full p-2.5 text-sm" rows={3} placeholder="Type your answers here, one per line. Skip any you do not know." value={answers} onChange={(e) => setAnswers(e.target.value)} />
                  <Button className="mt-2" size="sm" variant="outline" onClick={rewrite} disabled={!!busy || !answers.trim()}>{busy === 'rewrite' ? 'Rewriting...' : 'Rewrite with my answers'}</Button>
                </div>
              )}
              {String(P.generated_by || '').includes('needs review') && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Check this draft: {String(P.generated_by).split('needs review:')[1]}</div>}

              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  {P.image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={P.image_url} alt={(P.image_alts || [])[0] || P.title} className="w-full rounded-xl border border-gray-200 object-cover" />}
                  <div className="grid grid-cols-3 gap-1.5">{(P.gallery_images || []).slice(0, 6).map((g: string, i: number) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={g} alt={(P.image_alts || [])[i + 1] || ''} className="h-14 w-full rounded-lg border border-gray-200 object-cover" />)}</div>
                  <p className="text-xs text-gray-400">Picture text the AI wrote: {(P.image_alts || []).filter(Boolean).length} of {1 + (P.gallery_images || []).length}</p>
                </div>
                <div className="space-y-3">
                  <Field label="Title"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
                  <Field label="Short summary"><textarea className="w-full p-2.5 text-sm" rows={2} value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} /></Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Starting price in ₹"><Input inputMode="numeric" value={String(edit.price ?? '')} onChange={(e) => setEdit({ ...edit, price: e.target.value.replace(/[^0-9]/g, '') })} /></Field>
                    <Field label="Category"><select className="w-full p-2.5 text-sm" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{Array.from(new Set([edit.category, ...opts.categories])).filter(Boolean).map((c: any) => <option key={c} value={c}>{c}</option>)}</select></Field>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">How it may look on Google</p>
                <p className="truncate text-[17px] text-blue-700">{edit.meta_title || 'Title'}</p>
                <p className="truncate text-xs text-green-700">www.retreatarcade.in/events/{P.slug}</p>
                <p className="text-[13px] text-gray-600">{edit.meta_description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Google title">{<><Input value={edit.meta_title} onChange={(e) => setEdit({ ...edit, meta_title: e.target.value })} />{cnt(edit.meta_title, 45, 62)}</>}</Field>
                <Field label="Google description">{<><textarea className="w-full p-2.5 text-sm" rows={2} value={edit.meta_description} onChange={(e) => setEdit({ ...edit, meta_description: e.target.value })} />{cnt(edit.meta_description, 120, 155)}</>}</Field>
              </div>
              <p className="text-xs text-gray-500">Main search phrase it is built around: <b>{P.focus_keyword || 'not set'}</b>. Keywords: {(P.meta_keywords || []).join(', ')}.</p>

              <details className="rounded-xl border border-gray-200 p-4 text-sm">
                <summary className="cursor-pointer font-semibold text-gray-800">Read the full page text, key points and questions</summary>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-600">{(P.highlights || []).map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                <div className="prose prose-sm mt-3 max-w-none [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: P.description || '' }} />
                <div className="mt-3 space-y-2">{(P.faqs || []).map((f: any, i: number) => <p key={i}><b>{f.q}</b><br />{f.a}</p>)}</div>
                <p className="mt-3 text-xs text-gray-500">To change the full text, publish first and edit it in <Link href={`/admin/events/${P.id}/edit`} className="font-semibold text-orange-700">Products</Link>, or save your edits above and press Rewrite.</p>
              </details>

              <div className="flex flex-wrap gap-3"><Button size="sm" variant="outline" onClick={saveEdits} disabled={!!busy}>{busy === 'save' ? 'Saving...' : 'Save my edits'}</Button></div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Which services is this product part of? Tick all that apply.</p>
                <p className="mb-2 text-xs text-gray-500">The AI suggests the best fits (marked). A product can be in several services. This decides which page ranks, so choose carefully.</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {opts.services.map((s: any) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50">
                      <input type="checkbox" checked={!!picked[s.id]} onChange={(e) => setPicked({ ...picked, [s.id]: e.target.checked })} />
                      <span>{String(s.title).trim()}</span>
                      {(detail.suggestedServiceIds || []).includes(s.id) && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Suggested</span>}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={onRequest} onChange={(e) => setOnRequest(e.target.checked)} disabled={edit.price !== '' && edit.price != null} /> Show &quot;price on request&quot; (no price entered)</label>

              <div className="flex flex-wrap gap-3">
                <Button onClick={publish} disabled={!!busy}>{busy === 'publish' ? 'Publishing...' : 'Publish product and attach to ticked services'}</Button>
                <Button variant="outline" onClick={discard} disabled={!!busy}>Delete this draft</Button>
              </div>
            </Num>
          )}

          {stage !== 'draft' && (
            <Num n={3} title="City pages" hint="One page for every live city, built around the phrase people search most there. They are written as drafts: nothing is live until you approve.">
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                <b>{P.title}</b> is live: <a className="font-semibold underline" href={`/events/${P.slug}`} target="_blank" rel="noopener noreferrer">open the product page</a>.
              </div>
              {stage !== 'done' && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={cities} disabled={!!busy}>{busy === 'cities' ? progress || 'Writing city pages...' : stage === 'cities' ? 'Continue writing city pages' : 'Write the city pages'}</Button>
                  <span className="text-xs text-gray-500">About 2 to 3 cents per city. Keep this page open; if you close it, the daily job finishes the rest.</span>
                </div>
              )}
              {draftPages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Drafts waiting for your approval ({draftPages.length})</p>
                  {draftPages.map((c: any) => (
                    <div key={c.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                      <b>{c.locations?.city}</b> <span className="text-gray-400">· {c.services?.title}</span>
                      <p className="text-gray-600">{c.meta_title}</p>
                      <p className="text-xs text-gray-400">Main keyword: {c.focus_keyword || 'not set'}</p>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={approve} disabled={!!busy}>{busy === 'approve' ? 'Publishing...' : `Publish all ${draftPages.length} city pages`}</Button>
                    <Link href="/admin/auto-pages"><Button variant="outline">Read and edit them in Auto Pages first</Button></Link>
                  </div>
                </div>
              )}
              {livePages.length > 0 && <p className="text-sm text-green-700">{livePages.length} city pages are live. See them in Auto Pages, step 4.</p>}
              {stage === 'done' && !draftPages.length && livePages.length === 0 && <p className="text-sm text-gray-500">No city page was needed (the product already has pages everywhere).</p>}
            </Num>
          )}
        </>
      )}
    </div>
  );
}
