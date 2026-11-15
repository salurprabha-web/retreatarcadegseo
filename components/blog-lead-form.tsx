'use client';

import { useState } from 'react';
import { MessageCircle, Send, CheckCircle2, Box } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/** Quote request at the end of every blog post. Saves to the same enquiries list as the contact form. */
export function BlogLeadForm({ slug, cityName, citySlug }: { slug: string; cityName?: string; citySlug?: string }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', date: '', note: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [err, setErr] = useState('');

  const wa = `https://wa.me/919063679687?text=${encodeURIComponent(`Hi Retreat Arcade! I read "${slug.replace(/-/g, ' ')}" and want a quote${cityName ? ` for an event in ${cityName}` : ''}.`)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 10 || !/^\S+@\S+\.\S+$/.test(f.email)) {
      setErr('Please add your name, a 10-digit phone number and a valid email.');
      return;
    }
    try {
      const last = Number(sessionStorage.getItem('blog-lead-at') || 0);
      if (Date.now() - last < 45_000) { setErr('Your request was just sent. Please wait a minute.'); return; }
    } catch {}
    setState('sending');
    const { error } = await supabase.from('contact_enquiries').insert([
      {
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        event_type: 'Blog enquiry',
        message: `[Blog lead: /blog/${slug}]${cityName ? `\nCity: ${cityName}` : ''}${f.date ? `\nEvent date: ${f.date}` : ''}${f.note.trim() ? `\n${f.note.trim()}` : ''}`,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      setState('idle');
      setErr('We could not send that just now. Please use the WhatsApp button and we will pick it up right away.');
      return;
    }
    try { sessionStorage.setItem('blog-lead-at', String(Date.now())); (window as any).gtag?.('event', 'generate_lead', { source: 'blog', page: slug }); } catch {}
    setState('done');
  }

  const input = 'w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-orange-400';

  return (
    <section id="quote" className="mt-10 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-white">Planning an event{cityName ? ` in ${cityName}` : ''}? Get a quick quote</h2>
      <p className="mt-1 text-white/70">Tell us the date and what you have in mind. We reply with availability and prices.</p>
      {state === 'done' ? (
        <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-500/15 p-4 text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Thank you! We have your request and will contact you shortly.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
          <input className={input} placeholder="Phone number" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" />
          <input className={input} placeholder="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          <input className={input} type="date" aria-label="Event date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <textarea className={`${input} sm:col-span-2`} rows={3} placeholder="Guests, venue, what you are looking for (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          {err && <p className="text-sm text-red-300 sm:col-span-2">{err}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" disabled={state === 'sending'} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">
              <Send className="h-4 w-4" /> {state === 'sending' ? 'Sending...' : 'Request a quote'}
            </button>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0F7A40] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0b6634]">
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
            <a href={`/plan-your-event${citySlug ? `?city=${citySlug}` : ''}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              <Box className="h-4 w-4" /> Plan it in 3D
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
