'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Phone, Plus, X, Search, Shuffle, Trash2, Move3d, Users } from 'lucide-react';
import { kindOf, KIND_COLOR, floorSide, GUESTS_PER_DOT, type Station } from './planner-utils';

const PlannerScene = dynamic(() => import('./planner-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/60">Loading 3D venue…</div>
  ),
});

export type PlannerProduct = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  category: string | null;
  image_url: string | null;
};

const EVENT_TYPES = ['Corporate event', 'Wedding / Sangeet', 'College fest', 'Brand activation', 'Family / Birthday', 'Exhibition'];
const WHATSAPP = '917993912762';

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Next free slot on a loose grid so newly added stations never overlap. */
function slotFor(index: number, side: number) {
  const half = side / 2 - 1.5;
  const cols = 4;
  const gap = 3.4;
  const x = ((index % cols) - (cols - 1) / 2) * gap;
  const z = -Math.floor(index / cols) * gap - 1;
  return {
    x: Math.max(-half, Math.min(half, x)),
    z: Math.max(-half, Math.min(half, z)),
  };
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function EventPlanner({ products }: { products: PlannerProduct[] }) {
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [guests, setGuests] = useState(150);
  const [city, setCity] = useState('Hyderabad');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [stations, setStations] = useState<(Station & { productId: string })[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [gl, setGl] = useState<boolean | null>(null);

  useEffect(() => setGl(canUseWebGL()), []);

  // /plan-your-event?add=<product id or slug> pre-places that product (used by "Place it in your 3D venue")
  const preAdded = useRef(false);
  useEffect(() => {
    if (preAdded.current) return;
    preAdded.current = true;
    const key = new URLSearchParams(window.location.search).get('add');
    const p = key ? products.find((x) => x.id === key || x.slug === key) : null;
    if (p) add(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort()],
    [products]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (cat === 'All' || p.category === cat) && (!q || p.title.toLowerCase().includes(q))
    );
  }, [products, cat, query]);

  const side = floorSide(guests);

  const add = (p: PlannerProduct) => {
    const uid = `${p.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setStations((prev) => {
      const { x, z } = slotFor(prev.length, side);
      return [...prev, { uid, productId: p.id, title: p.title, kind: kindOf(p.title, p.category), x, z }];
    });
    setSelected(uid);
  };
  const remove = (uid: string) => {
    setStations((prev) => prev.filter((s) => s.uid !== uid));
    setSelected((s) => (s === uid ? null : s));
  };
  const move = (uid: string, x: number, z: number) =>
    setStations((prev) => prev.map((s) => (s.uid === uid ? { ...s, x, z } : s)));
  const tidy = () => setStations((prev) => prev.map((s, i) => ({ ...s, ...slotFor(i, side) })));

  // keep stations on the floor if the venue shrinks
  useEffect(() => {
    const half = side / 2 - 1.3;
    setStations((prev) =>
      prev.map((s) => ({ ...s, x: Math.max(-half, Math.min(half, s.x)), z: Math.max(-half, Math.min(half, s.z)) }))
    );
  }, [side]);

  const total = stations.reduce((sum, s) => sum + (Number(byId.get(s.productId)?.price) || 0), 0);
  const unpriced = stations.filter((s) => !byId.get(s.productId)?.price).length;

  const message = useMemo(() => {
    const counts = new Map<string, number>();
    stations.forEach((s) => counts.set(s.productId, (counts.get(s.productId) || 0) + 1));
    const lines = Array.from(counts.entries()).map(([id, n]) => {
      const p = byId.get(id)!;
      return `• ${p.title}${n > 1 ? ` ×${n}` : ''}${p.price ? ` (from ${inr(Number(p.price))} each)` : ''}`;
    });
    return [
      "Hi Retreat Arcade! I planned my event using your 3D planner and would like a quote.",
      `Event: ${eventType}`,
      `Guests: ${guests}`,
      `City: ${city || '—'}`,
      stations.length ? `Products:\n${lines.join('\n')}` : 'Products: (still deciding — please suggest)',
      total ? `Estimated starting total: ${inr(total)}${unpriced ? ' + items on request' : ''}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [stations, byId, eventType, guests, city, total, unpriced]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
      {/* ───────────── 3D venue ───────────── */}
      <div className="relative min-h-[380px] overflow-hidden rounded-3xl border border-white/10 bg-[#070a1c] shadow-[0_30px_80px_-30px_rgba(139,92,246,0.5)] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:min-h-[560px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 30%, rgba(139,92,246,0.22), transparent 70%), radial-gradient(40% 40% at 90% 90%, rgba(251,146,60,0.16), transparent 70%)',
          }}
        />
        {gl === false ? (
          <div className="relative flex h-full items-center justify-center p-8 text-center text-white/70">
            Your browser can&apos;t show the 3D view, but you can still build your setup on the right and send it to us.
          </div>
        ) : gl ? (
          <div className="absolute inset-0">
            <PlannerScene stations={stations} selected={selected} guests={guests} onSelect={setSelected} onMove={move} />
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur">
            <Move3d className="h-3.5 w-3.5 text-orange-400" /> Drag a station to place it · drag floor to rotate · scroll to zoom
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur">
            <Users className="h-3.5 w-3.5 text-indigo-300" /> Each dot ≈ {GUESTS_PER_DOT} guests · venue sized to {guests} guests
          </span>
        </div>
      </div>

      {/* ───────────── Controls ───────────── */}
      <div className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-400">1 · Your event</h2>
          <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Event type">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={eventType === t}
                onClick={() => setEventType(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  eventType === t
                    ? 'border-orange-400 bg-orange-500 text-white'
                    : 'border-white/15 bg-white/5 text-white/70 hover:border-orange-400/60 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="mb-1 flex items-center justify-between text-sm text-white/80" htmlFor="guests">
            <span>Guests</span>
            <span className="text-lg font-extrabold text-white">{guests}</span>
          </label>
          <input
            id="guests"
            type="range"
            min={20}
            max={1000}
            step={10}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mb-4 w-full accent-orange-500"
          />
          <label className="mb-1 block text-sm text-white/80" htmlFor="city">
            City
          </label>
          <input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Hyderabad"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-400">2 · Add products to your venue</h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  cat === c ? 'border-orange-400 bg-orange-500 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-white/55">No products match.</li>}
            {filtered.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 pr-3"
              >
                <span
                  className="h-10 w-10 flex-shrink-0 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${KIND_COLOR[kindOf(p.title, p.category)]}, #1e1b4b)` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                  <p className="text-xs text-white/55">{p.price ? `from ${inr(Number(p.price))}` : 'Price on request'}</p>
                </div>
                <button
                  onClick={() => add(p)}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
                  aria-label={`Add ${p.title} to venue`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-orange-400/30 bg-gradient-to-b from-orange-500/10 to-white/[0.03] p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-400">3 · Your setup</h2>
            <div className="flex gap-2">
              <button
                onClick={tidy}
                disabled={!stations.length}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40"
              >
                <Shuffle className="h-3.5 w-3.5" /> Tidy layout
              </button>
              <button
                onClick={() => {
                  setStations([]);
                  setSelected(null);
                }}
                disabled={!stations.length}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {stations.length === 0 ? (
            <p className="py-4 text-sm text-white/65">Nothing yet — add a product above and it appears in the 3D venue.</p>
          ) : (
            <ul className="mb-4 space-y-1.5">
              {stations.map((s) => {
                const p = byId.get(s.productId);
                return (
                  <li
                    key={s.uid}
                    onClick={() => setSelected(s.uid)}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      selected === s.uid ? 'border-orange-400 bg-orange-500/15' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_COLOR[s.kind] }} />
                    <span className="flex-1 truncate text-white/90">{s.title}</span>
                    <span className="text-xs text-white/60">{p?.price ? inr(Number(p.price)) : 'on request'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(s.uid);
                      }}
                      aria-label={`Remove ${s.title}`}
                      className="rounded-full p-1 text-white/55 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mb-4 flex items-end justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/55">Estimated starting total</p>
              <p className="text-3xl font-extrabold text-white">{total ? inr(total) : '—'}</p>
              {unpriced > 0 && <p className="text-xs text-white/55">+ {unpriced} item{unpriced > 1 ? 's' : ''} priced on request</p>}
            </div>
            <p className="max-w-[10rem] text-right text-[11px] leading-snug text-white/50">
              Starting prices only. Final quote depends on duration, city and customisation.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#128C4A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f7a40]"
            >
              <MessageCircle className="h-4 w-4" /> Send plan on WhatsApp
            </a>
            <a
              href="tel:+919063679687"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-orange-400" /> Call
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
