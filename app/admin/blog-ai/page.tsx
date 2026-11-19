'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';
import { supabase } from '@/lib/supabase-client';

const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const slotText = (n: number) => (n === 3 ? 'Mon, Wed, Fri at 10:00 AM' : 'Tue and Fri at 10:00 AM');
const PROSE = 'prose prose-sm max-w-none [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:font-semibold [&_a]:text-orange-700 [&_table]:my-3 [&_th]:border [&_td]:border [&_th]:p-1.5 [&_td]:p-1.5 [&_figure]:my-3 [&_img]:max-w-full [&_img]:rounded-lg';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Step({ n, title, sub, children, right }: { n: number; title: string; sub: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{n}</span>
        <div className="mr-auto"><h2 className="text-lg font-bold text-gray-900">{title}</h2><p className="text-sm text-gray-500">{sub}</p></div>
        {right}
      </div>
      {children}
    </section>
  );
}

type Img = { url: string; alt: string; caption: string };

/* ------------------------------------------------------------------ the full editor */
function Editor({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [newImg, setNewImg] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adminApi('/api/admin/blog-ai', { action: 'getpost', id }).then((r) => {
      const p = r.post;
      setF({
        title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '', category: p.category || '', tags: (p.tags || []).join(', '), reading_time: p.reading_time || '',
        meta_title: p.meta_title || '', meta_description: p.meta_description || '', meta_keywords: (p.meta_keywords || []).join(', '), canonical_url: p.canonical_url || '',
        featured_image_url: p.featured_image_url || '', content: p.content || '', focus_keyword: p.focus_keyword || '',
        images: (Array.isArray(p.content_images) ? p.content_images : []) as Img[], faqs: (Array.isArray(p.faqs) ? p.faqs : []) as { q: string; a: string }[],
      });
    }).catch((e) => { toast.error(e.message); onClose(); });
  }, [id, onClose]);

  if (!f) return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Opening the post...</div>;
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const setImg = (i: number, k: keyof Img, v: string) => set('images', f.images.map((m: Img, j: number) => (j === i ? { ...m, [k]: v } : m)));

  function insert(html: string) {
    const el = area.current;
    const at = el ? el.selectionStart : f.content.length;
    set('content', f.content.slice(0, at) + '\n' + html + '\n' + f.content.slice(at));
    toast.success('Inserted where your cursor was');
  }
  const figure = (m: Img) => `<figure><img src="${esc(m.url)}" alt="${esc(m.alt)}" loading="lazy" />${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ''}</figure>`;

  function addImages() {
    const add: Img[] = newImg.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => { const [u, ...n] = l.split('|'); return { url: u.trim(), alt: n.join('|').trim(), caption: '' }; }).filter((m) => /^https:\/\//i.test(m.url));
    if (!add.length) { toast.error('Paste links that start with https://'); return; }
    set('images', [...f.images, ...add]); setNewImg('');
  }

  async function aiAlt() {
    setBusy('alt');
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'alt', context: f.title, images: f.images.map((m: Img) => ({ url: m.url, note: m.alt })) });
      set('images', f.images.map((m: Img) => { const g = (r.images || []).find((x: any) => x.url === m.url); return g ? { ...m, alt: g.alt || m.alt, caption: m.caption || g.caption } : m; }));
      toast.success('Alt text written. Check it, then save.');
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function save() {
    setBusy('save');
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'savepost', id, fields: f });
      set('slug', r.slug);
      toast.success('Saved');
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const words = f.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const used = (u: string) => f.content.includes(u);

  return (
    <section className="space-y-5 rounded-2xl border-2 border-orange-300 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-bold text-gray-900">Edit post <span className="text-sm font-normal text-gray-500">({words} words)</span></h2>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={save} disabled={!!busy}>{busy === 'save' ? 'Saving...' : 'Save changes'}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title"><Input value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
        <Field label="Web address (slug)" hint="Changing it after the post is live breaks old links. Leave as is unless it is still a draft."><Input value={f.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
        <Field label="Main keyword" hint="Shown for your reference. Change keyword ownership in Keywords."><Input value={f.focus_keyword} onChange={(e) => set('focus_keyword', e.target.value)} /></Field>
        <Field label="Category"><Input value={f.category} onChange={(e) => set('category', e.target.value)} /></Field>
        <Field label="Tags" hint="Separate with commas."><Input value={f.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
        <Field label="Reading time"><Input value={f.reading_time} placeholder="6 min read" onChange={(e) => set('reading_time', e.target.value)} /></Field>
      </div>
      <Field label="Short summary (excerpt)" hint="Shown on the blog list and in sharing."><textarea className="w-full p-2.5 text-sm" rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></Field>

      {/* pictures */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-semibold text-gray-900">Pictures ({f.images.length})</h3>
          <Button size="sm" variant="outline" onClick={aiAlt} disabled={!!busy || !f.images.length}>{busy === 'alt' ? 'Looking...' : 'Write alt text with AI'}</Button>
        </div>
        {f.images.map((m: Img, i: number) => (
          <div key={i} className="grid items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-[96px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="h-20 w-24 rounded-md object-cover" />
            <div className="space-y-2">
              <div className="truncate font-mono text-[11px] text-gray-400">{m.url}</div>
              <Input value={m.alt} placeholder="Alt text: what the picture shows" onChange={(e) => setImg(i, 'alt', e.target.value)} />
              <Input value={m.caption} placeholder="Caption (optional)" onChange={(e) => setImg(i, 'caption', e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => insert(figure(m))}>Insert at cursor{used(m.url) ? ' (already used)' : ''}</Button>
                <Button size="sm" variant="outline" onClick={() => set('featured_image_url', m.url)}>{f.featured_image_url === m.url ? 'Cover picture' : 'Make cover'}</Button>
                <Button size="sm" variant="outline" onClick={() => set('images', f.images.filter((_: any, j: number) => j !== i))}>Remove from list</Button>
              </div>
            </div>
          </div>
        ))}
        <Field label="Add pictures" hint="One per line: Cloudinary link | what it shows. Any number. Then use Insert at cursor to place each one exactly where you want it in the text.">
          <textarea className="w-full p-2.5 font-mono text-xs" rows={3} value={newImg} onChange={(e) => setNewImg(e.target.value)} placeholder="https://res.cloudinary.com/your-name/image/upload/booth1.jpg | 360 photo booth at a corporate event" />
        </Field>
        <Button size="sm" variant="outline" onClick={addImages}>Add to list</Button>
      </div>

      {/* text */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-semibold text-gray-900">Post text</h3>
          <Button size="sm" variant={view === 'write' ? 'default' : 'outline'} onClick={() => setView('write')}>Edit</Button>
          <Button size="sm" variant={view === 'preview' ? 'default' : 'outline'} onClick={() => setView('preview')}>Preview</Button>
        </div>
        {view === 'write' ? (
          <>
            <p className="text-xs text-gray-500">Click inside the text where a picture should go, then press <b>Insert at cursor</b> on that picture above. Headings use &lt;h2&gt;, paragraphs &lt;p&gt;, links &lt;a href=&quot;/products/...&quot;&gt;. Keep the internal links, they help ranking.</p>
            <textarea ref={area} className="w-full p-3 font-mono text-xs leading-relaxed" rows={26} value={f.content} onChange={(e) => set('content', e.target.value)} />
          </>
        ) : (
          <div className="max-h-[620px] overflow-auto rounded-xl border border-gray-200 bg-white p-5"><div className={PROSE} dangerouslySetInnerHTML={{ __html: f.content }} /></div>
        )}
      </div>

      {/* faq */}
      <div className="space-y-3 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2"><h3 className="mr-auto font-semibold text-gray-900">Questions and answers (FAQ)</h3><Button size="sm" variant="outline" onClick={() => set('faqs', [...f.faqs, { q: '', a: '' }])}>Add question</Button></div>
        {f.faqs.map((x: any, i: number) => (
          <div key={i} className="space-y-2 rounded-lg bg-gray-50 p-3">
            <Input value={x.q} placeholder="Question" onChange={(e) => set('faqs', f.faqs.map((y: any, j: number) => (j === i ? { ...y, q: e.target.value } : y)))} />
            <textarea className="w-full p-2.5 text-sm" rows={2} value={x.a} placeholder="Answer" onChange={(e) => set('faqs', f.faqs.map((y: any, j: number) => (j === i ? { ...y, a: e.target.value } : y)))} />
            <Button size="sm" variant="outline" onClick={() => set('faqs', f.faqs.filter((_: any, j: number) => j !== i))}>Remove</Button>
          </div>
        ))}
        {!f.faqs.length && <p className="text-sm text-gray-400">No questions yet.</p>}
      </div>

      {/* seo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Google title" hint={`${f.meta_title.length} characters. Keep under 60.`}><Input value={f.meta_title} onChange={(e) => set('meta_title', e.target.value)} /></Field>
        <Field label="Cover picture link"><Input value={f.featured_image_url} onChange={(e) => set('featured_image_url', e.target.value)} /></Field>
        <Field label="Google description" hint={`${f.meta_description.length} characters. Keep 120 to 160.`}><textarea className="w-full p-2.5 text-sm" rows={3} value={f.meta_description} onChange={(e) => set('meta_description', e.target.value)} /></Field>
        <div className="space-y-4">
          <Field label="Search keywords" hint="Separate with commas."><Input value={f.meta_keywords} onChange={(e) => set('meta_keywords', e.target.value)} /></Field>
          <Field label="Canonical link" hint="Leave empty unless you know you need it."><Input value={f.canonical_url} onChange={(e) => set('canonical_url', e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={save} disabled={!!busy}>{busy === 'save' ? 'Saving...' : 'Save changes'}</Button></div>
    </section>
  );
}

/* ------------------------------------------------------------------ the page */
export default function BlogAiAdmin() {
  const [cities, setCities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [city, setCity] = useState('');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [ideaNote, setIdeaNote] = useState('');
  const [plan, setPlan] = useState<any>(null); // { idea, outline, notes, images, product, service }
  const [manual, setManual] = useState({ keyword: '', idea: '' });
  const [showManual, setShowManual] = useState(false);
  const [busy, setBusy] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [perWeek, setPerWeek] = useState(3);
  const [editing, setEditing] = useState('');
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
    setBusy('ideas'); setIdeas([]);
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'ideas', city: city || undefined });
      setIdeas(r.ideas || []);
      setIdeaNote(r.note || (r.ideas?.length ? '' : 'No new ideas right now. Open Keywords and press "Add ideas for every city", then try again.'));
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function planIdea(i: any) {
    setBusy('outline' + i.keyword);
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'outline', keyword: i.keyword, title: i.title, angle: i.angle, citySlug: i.city_slug, productSlug: i.product_slug, serviceSlug: i.service_slug });
      setPlan({ keyword: i.keyword, angle: i.angle, city: i.city_slug || '', product: i.product_slug || '', service: i.service_slug || '', outline: r.outline, notes: '', images: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  async function planManual() {
    if (manual.keyword.trim().length < 4) { toast.error('Type the main keyword first'); return; }
    setBusy('outlinem');
    try {
      const r = await adminApi('/api/admin/blog-ai', { action: 'outline', keyword: manual.keyword, angle: manual.idea, citySlug: city || null });
      setPlan({ keyword: manual.keyword, angle: manual.idea, city, product: '', service: '', outline: r.outline, notes: manual.idea, images: '' });
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const setOutline = (fn: (o: any) => any) => setPlan((p: any) => ({ ...p, outline: fn(p.outline) }));

  async function write() {
    if (!plan) return;
    setBusy('write'); setLast(null);
    try {
      const r = await adminApi('/api/admin/blog-ai', {
        action: 'generate', keyword: plan.keyword, idea: [plan.angle, plan.notes].filter(Boolean).join('\n'), title: plan.outline.title,
        outline: { title: plan.outline.title, sections: plan.outline.sections, faq_questions: plan.outline.faq_questions },
        citySlug: plan.city || null, productSlug: plan.product || null, serviceSlug: plan.service || null, images: plan.images.split(/\r?\n/),
      });
      setLast(r); setPlan(null); setIdeas((x) => x.filter((i) => i.keyword !== plan.keyword));
      toast.success('Draft written. It is open in the editor.');
      await load();
      if (r.id) setEditing(r.id);
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

  const closeEditor = useCallback(() => setEditing(''), []);
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

      {editing && <Editor id={editing} onClose={closeEditor} onSaved={load} />}

      {/* ---------------- ideas ---------------- */}
      {!plan && (
        <Step n={1} title="Get blog ideas" sub="The AI reads your keyword list, picks phrases nobody on your site targets yet, and turns them into post ideas. You choose which to write.">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="City" hint="Ideas for one city, or leave empty for every city."><select className="p-2.5 text-sm" value={city} onChange={(e) => setCity(e.target.value)}><option value="">All cities</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}</select></Field>
            <Button onClick={suggest} disabled={!!busy}>{busy === 'ideas' ? 'Thinking...' : 'Suggest blog ideas'}</Button>
            <button className="pb-2 text-xs font-medium text-gray-500 underline" onClick={() => setShowManual(!showManual)}>{showManual ? 'Hide' : 'Or write from my own idea'}</button>
          </div>
          {ideaNote && <p className="mt-3 text-sm text-amber-700">{ideaNote}</p>}
          {ideas.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {ideas.map((i) => (
                <div key={i.keyword} className="flex flex-col rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-700">{i.post_type || 'Post'}</span>
                    {i.city_slug && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{i.city_slug}</span>}
                    {i.volume != null && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">{i.volume} searches/mo</span>}
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">{i.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{i.angle}</p>
                  <p className="mt-1 text-xs text-gray-400">Targets: <b className="text-gray-600">{i.keyword}</b>{i.product_slug ? ` · features ${i.product_slug}` : ''}</p>
                  <p className="mt-1 text-xs text-gray-500">Why: {i.why}</p>
                  <div className="mt-3 pt-1"><Button size="sm" onClick={() => planIdea(i)} disabled={!!busy}>{busy === 'outline' + i.keyword ? 'Planning...' : 'Plan this post'}</Button></div>
                </div>
              ))}
            </div>
          )}
          {showManual && (
            <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
              <Field label="Main keyword" hint="The phrase this post should rank for."><Input value={manual.keyword} placeholder="photo booth rental cost in hyderabad" onChange={(e) => setManual({ ...manual, keyword: e.target.value })} /></Field>
              <Field label="Your idea" hint="What should the reader learn or decide? Add facts you want included."><textarea className="w-full p-2.5 text-sm" rows={3} value={manual.idea} onChange={(e) => setManual({ ...manual, idea: e.target.value })} /></Field>
              <Button size="sm" onClick={planManual} disabled={!!busy}>{busy === 'outlinem' ? 'Planning...' : 'Plan this post'}</Button>
            </div>
          )}
        </Step>
      )}

      {/* ---------------- outline approval ---------------- */}
      {plan && (
        <Step n={1} title="Approve the plan" sub="Change anything: headings, points, questions. Add your pictures. Then the AI writes the full post exactly to this plan." right={<Button variant="outline" size="sm" onClick={() => setPlan(null)}>Back to ideas</Button>}>
          <div className="space-y-4">
            <Field label="Post title"><Input value={plan.outline.title} onChange={(e) => setOutline((o) => ({ ...o, title: e.target.value }))} /></Field>
            <p className="text-xs text-gray-500">Keyword: <b>{plan.keyword}</b></p>
            <div className="space-y-3">
              {plan.outline.sections.map((s: any, i: number) => (
                <div key={i} className="space-y-2 rounded-xl border border-gray-200 p-3">
                  <div className="flex gap-2">
                    <Input value={s.heading} onChange={(e) => setOutline((o) => ({ ...o, sections: o.sections.map((x: any, j: number) => (j === i ? { ...x, heading: e.target.value } : x)) }))} />
                    <Button size="sm" variant="outline" onClick={() => setOutline((o) => ({ ...o, sections: o.sections.filter((_: any, j: number) => j !== i) }))}>Remove</Button>
                  </div>
                  <textarea className="w-full p-2.5 text-sm" rows={3} value={s.points.join('\n')} onChange={(e) => setOutline((o) => ({ ...o, sections: o.sections.map((x: any, j: number) => (j === i ? { ...x, points: e.target.value.split('\n') } : x)) }))} />
                  <p className="text-[11px] text-gray-400">One point per line: what this section should cover.</p>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setOutline((o) => ({ ...o, sections: [...o.sections, { heading: '', points: [] }] }))}>Add a section</Button>
            </div>
            <Field label="Questions to answer in the FAQ" hint="One per line."><textarea className="w-full p-2.5 text-sm" rows={4} value={plan.outline.faq_questions.join('\n')} onChange={(e) => setOutline((o) => ({ ...o, faq_questions: e.target.value.split('\n') }))} /></Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="City"><select className="w-full p-2.5 text-sm" value={plan.city} onChange={(e) => setPlan({ ...plan, city: e.target.value })}><option value="">No city (India-wide)</option>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}</select></Field>
              <Field label="Product to feature"><select className="w-full p-2.5 text-sm" value={plan.product} onChange={(e) => setPlan({ ...plan, product: e.target.value })}><option value="">None</option>{products.map((p) => <option key={p.slug} value={p.slug}>{String(p.title).trim()}</option>)}</select></Field>
              <Field label="Service to feature"><select className="w-full p-2.5 text-sm" value={plan.service} onChange={(e) => setPlan({ ...plan, service: e.target.value })}><option value="">None</option>{services.map((p) => <option key={p.slug} value={p.slug}>{String(p.title).trim()}</option>)}</select></Field>
            </div>
            <Field label="Facts to include (optional)" hint="Real details only, e.g. events you did, setup time, capacity. The AI never invents numbers."><textarea className="w-full p-2.5 text-sm" rows={2} value={plan.notes} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} /></Field>
            <Field label="Pictures (Cloudinary links, optional)" hint="One per line: link | what it shows. Any number. You can add more later in the editor and place each one wherever you like.">
              <textarea className="w-full p-2.5 font-mono text-xs" rows={4} value={plan.images} onChange={(e) => setPlan({ ...plan, images: e.target.value })} placeholder="https://res.cloudinary.com/your-name/image/upload/booth1.jpg | 360 photo booth at a corporate event" />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={write} disabled={!!busy}>{busy === 'write' ? 'Writing, this takes up to a minute...' : 'Approve and write the full post'}</Button>
              <span className="text-xs text-gray-500">Costs roughly 10 to 30 cents of AI use.</span>
            </div>
          </div>
        </Step>
      )}
      {last && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">Draft saved: <b>{last.title}</b> ({last.links} links, {last.images} pictures){last.problems?.length ? `. Please check: ${last.problems.join('; ')}` : ''}</div>}

      {/* ---------------- review ---------------- */}
      <Step n={2} title={`Edit, approve and schedule (${drafts.length})`} sub="Open Edit for the full editor. Then Publish now, Schedule a time, or Add to queue to take the next free slot."
        right={(
          <div className="text-sm">
            <label className="mr-2 text-xs font-semibold text-gray-500">Posts per week</label>
            <select className="p-1.5 text-sm" value={perWeek} onChange={(e) => { const v = Number(e.target.value); setPerWeek(v); try { localStorage.setItem('blog-per-week', String(v)); } catch {} }}>
              <option value={3}>3 ({slotText(3)})</option>
              <option value={2}>2 ({slotText(2)})</option>
            </select>
          </div>
        )}>
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
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</Button>
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
                  <div className="max-h-[520px] overflow-auto rounded-xl border border-gray-200 bg-white p-5"><div className={PROSE} dangerouslySetInnerHTML={{ __html: preview[p.id] || '<p>Loading preview...</p>' }} /></div>
                </div>
              )}
            </div>
          ))}
          {!drafts.length && <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No drafts waiting. Get ideas in step 1.</div>}
        </div>
      </Step>

      {/* ---------------- scheduled + live ---------------- */}
      <Step n={3} title={`Scheduled (${scheduled.length}) and live`} sub="Scheduled posts appear on the site by themselves at their time (within about 5 minutes). Times are India time.">
        <div className="space-y-2">
          {scheduled.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div><span className="mr-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{fmt(p.at)}</span><b className="text-gray-900">{p.title}</b></div>
              <div className="flex gap-2">
                {p.ai && <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</Button>}
                <Button size="sm" variant="outline" onClick={() => act('unschedule', p)} disabled={!!busy}>Back to drafts</Button>
              </div>
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
                  <span className="flex gap-3"><button className="font-medium text-gray-600 hover:underline" onClick={() => { setEditing(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button><a className="font-medium text-orange-700 hover:underline" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">Open</a></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Step>
    </div>
  );
}
