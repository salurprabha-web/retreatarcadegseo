'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { FitImage } from '@/components/fit-image';

type Item = { slug: string; title: string; event_type: string | null; city_slug: string | null; event_date: string | null; photo: { url: string; alt: string } | null };

/** All case studies with simple city and event-type filters (the list itself is in the page for Google; this only narrows it for visitors). */
export function OurWorkGrid({ items, cityNames }: { items: Item[]; cityNames: Record<string, string> }) {
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const cities = useMemo(() => Array.from(new Set(items.map((i) => i.city_slug).filter(Boolean))) as string[], [items]);
  const types = useMemo(() => Array.from(new Set(items.map((i) => i.event_type).filter(Boolean))) as string[], [items]);
  const shown = items.filter((i) => (!city || i.city_slug === city) && (!type || i.event_type === type));

  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? 'border-orange-400 bg-orange-500/20 text-orange-200' : 'border-white/15 text-white/70 hover:border-orange-400/50'}`;

  return (
    <>
      {(cities.length > 1 || types.length > 1) && (
        <div className="mb-6 space-y-3">
          {cities.length > 1 && (
            <div className="flex flex-wrap gap-2" aria-label="Filter by city">
              <button className={chip(!city)} onClick={() => setCity('')}>All cities</button>
              {cities.map((c) => <button key={c} className={chip(city === c)} onClick={() => setCity(city === c ? '' : c)}>{cityNames[c] || c}</button>)}
            </div>
          )}
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2" aria-label="Filter by event type">
              <button className={chip(!type)} onClick={() => setType('')}>All events</button>
              {types.map((t) => <button key={t} className={chip(type === t)} onClick={() => setType(type === t ? '' : t)}>{t}</button>)}
            </div>
          )}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.slug}>
            <Link href={`/our-work/${c.slug}`} className="glass group flex h-full flex-col overflow-hidden rounded-3xl transition hover:-translate-y-1">
              {c.photo && <span className="relative block aspect-[4/3] w-full overflow-hidden bg-white/5"><FitImage src={c.photo.url} alt={c.photo.alt} /></span>}
              <span className="flex flex-1 flex-col p-5">
                {c.event_type && <span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-orange-300">{c.event_type}</span>}
                <span className="mb-2 text-lg font-bold text-white">{c.title}</span>
                <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                  {c.city_slug && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cityNames[c.city_slug] || c.city_slug}</span>}
                  {c.event_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(c.event_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!shown.length && <p className="text-center text-sm text-white/60">Nothing for that filter yet.</p>}
    </>
  );
}
