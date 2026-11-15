'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';
import { supabase } from '@/lib/supabase-client';

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const slotText = (n: number) => (n === 3 ? 'Mon, Wed, Fri at 10:00 AM' : 'Tue and Fri at 10:00 AM');

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function BlogAiAdmin() {
  const [cities, setCities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [city, setCity] = useState('');
  const [product, setProduct] = useState('');
  const [service, setService] = useState('');
  const [keyword, setKeyword] = useState('');
  const [idea, setIdea] = useState('');
  const [images, setImages] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [topicNote, setTopicNote] = useState('');
  const [busy, setBusy] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [perWeek, setPerWeek] = useState(3);
  const [open, setOpen] = useState('');
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [when, setWhen] = useState<Record<string, string>>({});
  const [step5, setStep5] = useState(true);
  const [last, setLast] = useState<any>(null);

  useEffect(() => {
    try { const v = Number(localStorage.getItem('blog-per-week')); if (v === 2 || v === 3) setPerWeek(v); } catch {}
    supabase.from('locations').select('slug, city').order('city').then(({ data }) => setCities(data || []));
    supabase.from('events').select('slug, title').eq('status', 'published').order('title').then(({ data }) => setProducts(data || []));
    supabase.from('services').select('slug, title').eq('status', 'published').order('title').then(({ data }) => setServices(data || []));
  }, []);

  const load = useCallback(async () => {
    try { const r = await adminApi('/api/admin/blog-ai', { action: 'list' }); setPosts(r.posts || []); setStep5(r.step5 !== false); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function suggest() {
    setBusy('topics');
    try { const r = await adminApi('/api/admin/blog-ai', { action: 'topics', city: city || undefined }); setTopics(r.topics || []); setTopicNote(r.note || (r.topics?.length ? '' : 'No free ideas yet. Open Keywords and press "Add ideas for every city".')); } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function write() {
    if (keyword.trim().length < 4) { toast.error('Choose the main keyword first'); return; }
    setBusy('write'); setLast(null);
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'generate', keyword, idea, citySlug: city || null, productSlug: product || null, serviceSlug: service || null, images: images.split(/\r?\n/) });
      setLast(r);
      toast.success('Draft ready: review it below');
      setKeyword(''); setIdea(''); setImages('');
      await load();
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function act(action: string, p: any, extra: any = {}) {
    setBusy(action + p.id);
    try {
      const r = await adminApi('/api/admin/blog-ai', { action, id: p.id, ...extra });
      if (action === 'publish') toast.success('Published. It shows on the site within about 5 minutes.');
      else if (action === 'schedule' || action === 'queue') toast.success(`Scheduled for ${fmt(r.at)} (India time)`);
      else if (action === 'unschedule') toast.success('Moved back to drafts');
      else if (action === 'delete') toast.success('Deleted');
      await load();
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function togglePreview(p: any) {
    setOpen(open === p.id ? '' : p.id);
    if (!preview[p.id]) {
      try { const r = await adminApi('/api/admin/blog-ai', { action: 'get', id: p.id }); setPreview((x) => ({ ...x, [p.id]: r.post.content })); } catch (e: any) { toast.error(e.message); }
    }
  }

  const drafts = posts.filter((p) => p.state === 'draft' && p.ai);
  const scheduled = posts.filter((p) => p.state === 'scheduled').sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const live = posts.filter((p) => p.state === 'live' && p.ai).slice(0, 10);

  return (
    <div className="space-y-6">
      {!step5 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">One setup step first</p>
          <p className="mt-1">Run <b>AUTO_PAGES_STEP5.sql</b> in Supabase (SQL Editor). Until then drafts can be written but the keyword is not locked and city links are not saved.</p>
        </div>
      )}

      {/* ---------------- write ---------------- */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">1</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Write a new post</h2>
            <p className="text-sm text-gray-500">The AI writes a draft with links to your real pages and your pictures. Nothing goes public until you approve it in step 2.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="City" hint="The post is written for this city. Leave empty for all of India."><select className="w-full p-2.5 text-sm" value={city} onChange={(e) => setCity(e.target.value)}><option value="">No city (India-wide)</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}</select></Field>
            <Field label="Product to feature" hint="Optional."><select className="w-full p-2.5 text-sm" value={product} onChange={(e) => setProduct(e.target.value)}><option value="">None</option>{products.map((p) => <option key={p.slug} value={p.slug}>{String(p.title).trim()}</option>)}</select></Field>
            <Field label="Service to feature" hint="Optional."><select className="w-full p-2.5 text-sm" value={service} onChange={(e) => setService(e.target.value)}><option value="">None</option>{services.map((p) => <option key={p.slug} value={p.slug}>{String(p.title).trim()}</option>)}</select></Field>
          </div>
          <Field label="Main keyword" hint="The phrase this post should rank for. Each phrase can have only one owner page, so no two posts or pages compete. Not sure? Press 'Suggest topics'.">
            <div className="flex gap-2"><Input value={keyword} placeholder="photo booth rental cost in hyderabad" onChange={(e) => setKeyword(e.target.value)} /><Button variant="outline" onClick={suggest} disabled={!!busy}>{busy === 'topics' ? '...' : 'Suggest topics'}</Button></div>
            {topicNote && <p className="text-xs text-amber-700">{topicNote}</p>}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {topics.map((t) => (
                  <button key={t.keyword} type="button" onClick={() => { setKeyword(t.keyword); if (t.city_slug) setCity(t.city_slug); }} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-orange-400 hover:bg-orange-50">
                    {t.keyword}{t.volume != null ? ` · ${t.volume}/mo` : ''}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Your idea" hint="What should the reader be able to do or decide after reading? Facts you want included are welcome (never invent numbers).">
            <textarea className="w-full p-2.5 text-sm" rows={3} placeholder="Help a company HR team in Hyderabad choose between a photo booth and VR games for an annual day." value={idea} onChange={(e) => setIdea(e.target.value)} />
          </Field>
          <Field label="Pictures (Cloudinary links)" hint="One per line: the link, then | and what it shows. Add as many as you like; 4 to 8 is ideal. The first one is the cover. Every picture is placed once, with alt text.">
            <textarea className="w-full p-2.5 font-mono text-xs" rows={5} placeholder={'https://res.cloudinary.com/your-name/image/upload/booth1.jpg | 360 photo booth at a corporate event\nhttps://res.cloudinary.com/your-name/image/upload/vr.jpg | VR simulator queue'} value={images} onChange={(e) => setImages(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={write} disabled={!!busy}>{busy === 'write' ? 'Writing, this takes up to a minute...' : 'Write draft'}</Button>
            <span className="text-xs text-gray-500">Costs roughly 10 to 30 cents of AI use.</span>
          </div>
          {last && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">Draft saved: <b>{last.title}</b> ({last.links} links, {last.images} pictures){last.problems?.length ? `. Please check: ${last.problems.join('; ')}` : ''}</div>}
        </div>
      </section>

      {/* ---------------- review ---------------- */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">2</span>
          <div className="mr-auto">
            <h2 className="text-lg font-bold text-gray-900">Review and approve ({drafts.length})</h2>
            <p className="text-sm text-gray-500">Read the preview, edit if you like, then <b>Publish now</b>, <b>Schedule</b> a time, or <b>Add to queue</b> to take the next free slot.</p>
          </div>
          <div className="text-sm">
            <label className="mr-2 text-xs font-semibold text-gray-500">Posts per week</label>
            <select className="p-1.5 text-sm" value={perWeek} onChange={(e) => { const v = Number(e.target.value); setPerWeek(v); try { localStorage.setItem('blog-per-week', String(v)); } catch {} }}>
              <option value={3}>3 ({slotText(3)})</option>
              <option value={2}>2 ({slotText(2)})</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {drafts.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => togglePreview(p)}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{p.words} words</span>
                    <span className={`rounded-full px-2 py-0.5 ${p.links >= 4 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.links} links</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{p.images} pictures</span>
                    {p.review && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">Check before publishing</span>}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-500">Keyword: {p.keyword || 'none'}{p.city ? ` · ${p.city}` : ''}</div>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/blog/${p.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link>
                  <Button size="sm" onClick={() => act('publish', p)} disabled={!!busy}>Publish now</Button>
                  <Button size="sm" variant="outline" onClick={() => act('queue', p, { perWeek })} disabled={!!busy}>Add to queue</Button>
                  <Button size="sm" variant="outline" onClick={() => window.confirm('Delete this draft?') && act('delete', p)} disabled={!!busy}>Delete</Button>
                </div>
              </div>
              {open === p.id && (
                <div className="space-y-4 border-t border-gray-100 p-4">
                  {p.review && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">The writer could not fully meet the quality rules: {p.review}. Please fix it in Edit before you publish.</div>}
                  <div className="flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 p-3">
                    <div><label className="block text-xs">Publish at (your local time)</label><input type="datetime-local" className="p-1.5 text-sm" value={when[p.id] || ''} onChange={(e) => setWhen({ ...when, [p.id]: e.target.value })} /></div>
                    <Button size="sm" variant="outline" disabled={!when[p.id] || !!busy} onClick={() => act('schedule', p, { at: new Date(when[p.id]).toISOString() })}>Schedule</Button>
                  </div>
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200 bg-white p-5">
                    <div className="prose prose-sm max-w-none [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:font-semibold [&_a]:text-orange-700 [&_table]:my-3 [&_th]:border [&_td]:border [&_th]:p-1.5 [&_td]:p-1.5 [&_figure]:my-3" dangerouslySetInnerHTML={{ __html: preview[p.id] || '<p>Loading preview...</p>' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {!drafts.length && <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No drafts waiting. Write one in step 1.</div>}
        </div>
      </section>

      {/* ---------------- scheduled + live ---------------- */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">3</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Scheduled ({scheduled.length}) and live</h2>
            <p className="text-sm text-gray-500">Scheduled posts appear on the site by themselves at their time (within about 5 minutes). Times are India time.</p>
          </div>
        </div>
        <div className="space-y-2">
          {scheduled.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div><span className="mr-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{fmt(p.at)}</span><b className="text-gray-900">{p.title}</b></div>
              <div className="flex gap-2"><Link href={`/admin/blog/${p.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link><Button size="sm" variant="outline" onClick={() => act('unschedule', p)} disabled={!!busy}>Back to drafts</Button></div>
            </div>
          ))}
          {!scheduled.length && <p className="text-sm text-gray-400">Nothing scheduled.</p>}
        </div>
        {live.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-gray-700">Recently live (AI posts)</p>
            <div className="space-y-1">
              {live.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="min-w-0"><b className="text-gray-900">{p.title}</b> <span className="text-gray-400">· {p.views} views</span></span>
                  <a className="font-medium text-orange-700 hover:underline" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">Open</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
