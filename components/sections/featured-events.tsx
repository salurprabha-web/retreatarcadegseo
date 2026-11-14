'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TiltCard } from '@/components/three/tilt-card';
import { ZoneChip } from '@/components/world/zone';

interface Event {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  price: number | null;
  image_url: string | null;
  category: string;
}

function ProductCard({ event, className = '' }: { event: Event; className?: string }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      draggable={false}
      className={`glass glass-hover group flex h-full flex-col overflow-hidden rounded-3xl ${className}`}
    >
      <div className="flex items-center justify-center overflow-hidden bg-black/50" style={{ minHeight: '190px' }}>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            draggable={false}
            className="h-auto max-h-[230px] w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center text-5xl text-white/30">📸</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {event.category && (
          <span className="self-start rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
            {event.category}
          </span>
        )}
        <h3 className="line-clamp-2 font-bold leading-snug text-white transition group-hover:text-orange-300">{event.title}</h3>
        {event.summary && <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-white/60">{event.summary}</p>}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          {event.price ? (
            <p className="font-extrabold text-orange-300">₹{Number(event.price).toLocaleString('en-IN')}+</p>
          ) : (
            <span className="text-xs italic text-white/55">Price on request</span>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-400 transition-all group-hover:gap-2">
            View <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * 3D ring carousel. Drag, use the arrows or the ← → keys. Cards facing the
 * viewer are bright and in focus; the rest recede. Autoplays gently until the
 * visitor interacts. Every card is a real link.
 */
export function Ring3D({ events }: { events: Event[] }) {
  const n = events.length;
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const s = useRef({ angle: 0, target: 0, dragging: false, lastX: 0, moved: 0, auto: true });
  const [cardW, setCardW] = useState(290);
  const theta = 360 / n;
  const radius = Math.round(cardW / 2 / Math.tan(Math.PI / n)) + 40;

  useEffect(() => {
    const fit = () => setCardW(window.innerWidth < 640 ? 245 : 290);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = s.current;
      if (st.auto && !st.dragging) st.target -= dt * 4; // slow drift
      st.angle += (st.target - st.angle) * (st.dragging ? 0.35 : 0.08);
      if (ringRef.current) ringRef.current.style.transform = `translateZ(${-radius}px) rotateY(${st.angle}deg)`;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const diff = ((((i * theta + st.angle) % 360) + 540) % 360) - 180; // -180..180, 0 = front
        const facing = Math.cos((diff * Math.PI) / 180);
        el.style.opacity = String(0.25 + 0.75 * Math.max(0, facing) ** 1.5);
        el.style.filter = facing > 0.85 ? 'none' : `blur(${(1 - Math.max(0, facing)) * 1.5}px)`;
        el.style.pointerEvents = facing > 0.55 ? 'auto' : 'none';
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [radius, theta]);

  const snap = (dir: number) => {
    const st = s.current;
    st.auto = false;
    st.target = Math.round(st.target / theta) * theta + dir * theta;
  };

  const release = () => {
    const st = s.current;
    if (!st.dragging) return;
    st.dragging = false;
    st.target = Math.round(st.target / theta) * theta;
  };

  return (
    <div
      className="relative"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') snap(1);
        if (e.key === 'ArrowRight') snap(-1);
      }}
    >
      <div
        className="mx-auto h-[470px] cursor-grab touch-pan-y select-none active:cursor-grabbing [perspective:1500px]"
        onPointerDown={(e) => {
          s.current.dragging = true;
          s.current.auto = false;
          s.current.lastX = e.clientX;
          s.current.moved = 0;
        }}
        onPointerMove={(e) => {
          const st = s.current;
          if (!st.dragging) return;
          const dx = e.clientX - st.lastX;
          st.lastX = e.clientX;
          st.moved += Math.abs(dx);
          st.target += dx * 0.28;
        }}
        onPointerUp={release}
        onPointerLeave={release}
        // a drag must not count as a click on the link underneath
        onClickCapture={(e) => {
          if (s.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div ref={ringRef} className="relative mx-auto h-full [transform-style:preserve-3d]" style={{ width: cardW }}>
          {events.map((ev, i) => (
            <div
              key={ev.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute inset-x-0 top-6 [backface-visibility:hidden]"
              style={{ transform: `rotateY(${i * theta}deg) translateZ(${radius}px)`, height: 420 }}
            >
              <ProductCard event={ev} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          onClick={() => snap(1)}
          aria-label="Previous product"
          className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:border-orange-400/60 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-xs uppercase tracking-widest text-white/55">Drag · swipe · arrow keys</span>
        <button
          onClick={() => snap(-1)}
          aria-label="Next product"
          className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:border-orange-400/60 hover:bg-white/10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ring, setRing] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('events')
        .select('id, title, slug, summary, price, image_url, category')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);
      setEvents(data || []);
      setLoading(false);
    }
    load();
    setRing(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section className="relative overflow-hidden px-0 py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(40% 40% at 10% 20%, rgba(251,146,60,0.14), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <ZoneChip className="mb-5">Zone 02 · Games Floor</ZoneChip>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Top Picks</p>
            <h2 className="text-shadow-soft text-4xl font-bold text-white md:text-6xl">Featured Products</h2>
          </div>
          <Link
            href="/events"
            className="inline-flex flex-shrink-0 items-center gap-1.5 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {ring && events.length >= 4 ? (
          <Ring3D events={events} />
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <TiltCard key={event.id} max={9} className="h-full rounded-2xl">
                <ProductCard event={event} />
              </TiltCard>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/events"
            data-magnetic="1"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.7)] transition hover:bg-orange-600"
          >
            Browse All 65+ Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
