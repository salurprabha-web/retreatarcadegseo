'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Camera,
  Check,
  Copy,
  DoorOpen,
  Lightbulb,
  Maximize2,
  Minimize2,
  MessageCircle,
  Minus,
  Move3d,
  Phone,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  ScanLine,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Trash2,
  TreePine,
  Users,
  Wand2,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  KIND_COLOR,
  KIND_LABEL,
  KIND_RADIUS,
  GUESTS_PER_DOT,
  TEMPLATES,
  autoLayout,
  bounds,
  clampToFloor,
  decodePlan,
  encodePlan,
  floorSide,
  kindOf,
  resolveCollisions,
  type Station,
  type Venue,
} from './planner-utils';
import type { PlannerApi, StationInfo, ViewCmd } from './planner-scene';

const PlannerScene = dynamic(() => import('./planner-scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/60">Building your 3D venue…</div>
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

const EVENT_TYPES = Object.keys(TEMPLATES);
const WHATSAPP = '917993912762';
const STORE_KEY = 'ra-3d-plan-v1';

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function EventPlanner({ products }: { products: PlannerProduct[] }) {
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [guests, setGuests] = useState(150);
  const [city, setCity] = useState('Hyderabad');
  const [venue, setVenue] = useState<Venue>('indoor');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [gl, setGl] = useState<boolean | null>(null);
  const [view, setView] = useState<ViewCmd>({ mode: 'free', n: 0 });
  const [touring, setTouring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [zoomOn, setZoomOn] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<PlannerApi | null>(null);

  useEffect(() => setGl(canUseWebGL()), []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const info = useMemo(() => {
    const m: Record<string, StationInfo> = {};
    products.forEach((p) => (m[p.id] = { image: p.image_url, price: p.price ? Number(p.price) : null }));
    return m;
  }, [products]);
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort()],
    [products]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (cat === 'All' || p.category === cat) && (!q || p.title.toLowerCase().includes(q)));
  }, [products, cat, query]);

  const side = floorSide(guests);

  /* ───────── load: shared link → ?add= → last saved plan ───────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('plan') ? decodePlan(params.get('plan')!) : null;
    const addKey = params.get('add');
    let saved: any = null;
    if (!shared) {
      try {
        saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      } catch {}
    }
    const src = shared || (saved && Array.isArray(saved.s) ? (saved as ReturnType<typeof decodePlan>) : null);
    if (src) {
      if (EVENT_TYPES.includes(src.t)) setEventType(src.t);
      setGuests(src.g);
      setCity(src.c || 'Hyderabad');
      setVenue(src.v);
      const next: Station[] = [];
      src.s.forEach(([pid, x, z, rot]) => {
        const p = byId.get(pid);
        if (p) next.push({ uid: uid(p.id), productId: p.id, title: p.title, kind: kindOf(p.title, p.category), x, z, rot });
      });
      setStations(next);
    }
    if (addKey) {
      const p = products.find((x) => x.id === addKey || x.slug === addKey);
      if (p) addProduct(p);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planObject = useMemo(
    () => ({
      t: eventType,
      g: guests,
      c: city,
      v: venue,
      s: stations.map((s) => [s.productId, Math.round(s.x * 10) / 10, Math.round(s.z * 10) / 10, Math.round(s.rot * 100) / 100] as [string, number, number, number]),
    }),
    [eventType, guests, city, venue, stations]
  );

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(planObject));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [planObject, hydrated]);

  /* ───────── station actions ───────── */
  const addProduct = (p: PlannerProduct) => {
    const id = uid(p.id);
    setStations((prev) => {
      const kind = kindOf(p.title, p.category);
      const slots = autoLayout([...prev.map((s) => s.kind), kind], floorSide(guestsRef.current));
      const slot = slots[slots.length - 1];
      const pos = resolveCollisions(slot.x, slot.z, kind, prev, floorSide(guestsRef.current));
      return [...prev, { uid: id, productId: p.id, title: p.title, kind, x: pos.x, z: pos.z, rot: 0 }];
    });
    setSelected(id);
  };
  const guestsRef = useRef(guests);
  guestsRef.current = guests;

  const remove = (id: string) => {
    setStations((prev) => prev.filter((s) => s.uid !== id));
    setSelected((s) => (s === id ? null : s));
  };
  const removeOneOf = (productId: string) => {
    setStations((prev) => {
      const i = [...prev].reverse().findIndex((s) => s.productId === productId);
      if (i < 0) return prev;
      const idx = prev.length - 1 - i;
      return prev.filter((_, k) => k !== idx);
    });
  };
  const rotate = useCallback((id: string, delta: number) => {
    setStations((prev) => prev.map((s) => (s.uid === id ? { ...s, rot: s.rot + delta } : s)));
  }, []);
  const duplicate = (id: string) => {
    const src = stations.find((s) => s.uid === id);
    const p = src && byId.get(src.productId);
    if (p) addProduct(p);
  };
  const move = useCallback((id: string, x: number, z: number) => {
    setStations((prev) => prev.map((s) => (s.uid === id ? { ...s, x, z } : s)));
  }, []);
  const tidy = () =>
    setStations((prev) => {
      const spots = autoLayout(prev.map((s) => s.kind), side);
      return prev.map((s, i) => ({ ...s, ...spots[i], rot: 0 }));
    });
  const clearAll = () => {
    setStations([]);
    setSelected(null);
  };

  /** Pick a balanced starter set from the real catalogue for this event type. */
  const autoPlan = (type: string) => {
    const t = TEMPLATES[type];
    const g = t.guests;
    const used = new Set<string>();
    const picked: PlannerProduct[] = [];
    t.recipe.forEach((kind) => {
      const options = products
        .filter((p) => kindOf(p.title, p.category) === kind && !used.has(p.id))
        .sort((a, b) => Number(!!b.image_url) - Number(!!a.image_url) || (Number(b.price) || 0) - (Number(a.price) || 0));
      const pick = options[0];
      if (pick) {
        used.add(pick.id);
        picked.push(pick);
      }
    });
    const kinds = picked.map((p) => kindOf(p.title, p.category));
    const spots = autoLayout(kinds, floorSide(g));
    setEventType(type);
    setGuests(g);
    setStations(
      picked.map((p, i) => ({ uid: uid(p.id), productId: p.id, title: p.title, kind: kinds[i], x: spots[i].x, z: spots[i].z, rot: 0 }))
    );
    setSelected(null);
    setView((v) => ({ mode: 'overview', n: v.n + 1 }));
  };

  // keep stations on the floor when the venue changes size
  useEffect(() => {
    setStations((prev) => prev.map((s) => ({ ...s, ...clampToFloor(s.x, s.z, side) })));
  }, [side]);

  // keyboard: R rotate, Delete remove, Esc deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (!selected) return;
      if (e.key === 'r' || e.key === 'R') rotate(selected, e.shiftKey ? -Math.PI / 4 : Math.PI / 4);
      else if (e.key === 'Delete' || e.key === 'Backspace') remove(selected);
      else if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, rotate]);

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  /* ───────── derived numbers ───────── */
  const groups = useMemo(() => {
    const m = new Map<string, number>();
    stations.forEach((s) => m.set(s.productId, (m.get(s.productId) || 0) + 1));
    return Array.from(m.entries()).map(([id, n]) => ({ p: byId.get(id)!, n })).filter((g) => g.p);
  }, [stations, byId]);

  const total = groups.reduce((sum, g) => sum + (Number(g.p.price) || 0) * g.n, 0);
  const unpriced = groups.filter((g) => !g.p.price).reduce((n, g) => n + g.n, 0);

  const usable = useMemo(() => {
    const b = bounds(side);
    return b.hw * 2 * (b.zMax - b.zMin + 2);
  }, [side]);
  const used = stations.reduce((a, s) => a + Math.PI * KIND_RADIUS[s.kind] ** 2, 0);
  const fill = Math.min(100, Math.round((used / usable) * 100));
  const perStation = stations.length ? Math.round(guests / stations.length) : null;

  const tips = useMemo(() => {
    const out: string[] = [];
    const kinds = new Set(stations.map((s) => s.kind));
    if (!stations.length) return ['Tap “Auto-plan for me” for a ready-made layout, or add products from the list.'];
    if (perStation && perStation > 60) out.push(`About ${perStation} guests per station — add another experience to avoid long queues.`);
    if (fill > 70) out.push('The floor is getting crowded. Increase guests (bigger hall) or remove one station.');
    if (!kinds.has('booth') && !kinds.has('mirror') && products.some((p) => ['booth', 'mirror'].includes(kindOf(p.title, p.category))))
      out.push('Add a photo or mirror booth — it is the most-shared experience at events.');
    if (stations.length >= 2 && kinds.size === 1) out.push('Mix experience types so different age groups all have something to do.');
    if (!out.length) out.push('Nice mix! Take the guided tour to walk through your event, then send it to us.');
    return out;
  }, [stations, perStation, fill, products]);

  /* ───────── share / save / quote ───────── */
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/plan-your-event?plan=${encodePlan(planObject)}`;
  }, [planObject]);

  const message = useMemo(() => {
    const lines = groups.map((g) => `• ${g.p.title}${g.n > 1 ? ` ×${g.n}` : ''}${g.p.price ? ` (from ${inr(Number(g.p.price))} each)` : ''}`);
    return [
      'Hi Retreat Arcade! I planned my event using your 3D planner and would like a quote.',
      `Event: ${eventType} (${venue === 'indoor' ? 'indoor hall' : 'outdoor'})`,
      `Guests: ${guests}`,
      `City: ${city || '—'}`,
      stations.length ? `Products:\n${lines.join('\n')}` : 'Products: (still deciding — please suggest)',
      total ? `Estimated starting total: ${inr(total)}${unpriced ? ' + items on request' : ''}` : '',
      stations.length ? `My 3D layout: ${shareUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [groups, stations.length, eventType, venue, guests, city, total, unpriced, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy your plan link:', shareUrl);
    }
  };

  const savePicture = () => {
    const url = apiRef.current?.snapshot();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-event-3d-plan.png';
    a.click();
  };

  const toggleFull = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  };

  const go = (mode: ViewCmd['mode']) => {
    setTouring(mode === 'tour' && stations.length > 0);
    setView((v) => ({ mode, n: v.n + 1 }));
  };
  const onTourStep = useCallback((id: string | null) => {
    if (id) setSelected(id);
    else setTouring(false);
  }, []);
  const onFree = useCallback(() => {
    setView((v) => ({ mode: 'free', n: v.n }));
    setTouring(false);
  }, []);

  const sel = stations.find((s) => s.uid === selected);
  const btn =
    'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur transition hover:border-orange-400/60 hover:text-white';

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* ───────────── 3D venue ───────────── */}
      <div
        ref={stageRef}
        onPointerDown={() => setZoomOn(true)}
        onPointerLeave={() => setZoomOn(false)}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#070a1c] shadow-[0_30px_80px_-30px_rgba(139,92,246,0.5)] ${
          full ? 'h-screen' : 'h-[68vh] min-h-[440px] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:min-h-[580px]'
        }`}
      >
        {gl === false ? (
          <div className="relative flex h-full items-center justify-center p-8 text-center text-white/70">
            Your browser can&apos;t show the 3D view, but you can still build your setup on the right and send it to us.
          </div>
        ) : gl ? (
          <div className="absolute inset-0">
            <PlannerScene
              stations={stations}
              info={info}
              selected={selected}
              guests={guests}
              venue={venue}
              view={view}
              zoomOn={zoomOn}
              onSelect={setSelected}
              onMove={move}
              onTourStep={onTourStep}
              onFree={onFree}
              apiRef={apiRef}
            />
          </div>
        ) : null}

        {/* top-right: camera */}
        <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
          <button className={btn} onClick={() => go('overview')} aria-label="Overview camera">
            <Eye className="h-3.5 w-3.5 text-orange-400" /> <span className="hidden sm:inline">Overview</span>
          </button>
          <button className={btn} onClick={() => go('top')} aria-label="Top-down plan view">
            <ScanLine className="h-3.5 w-3.5 text-orange-400" /> <span className="hidden sm:inline">Top view</span>
          </button>
          <button className={btn} onClick={() => go('entrance')} aria-label="Walk in from the entrance">
            <DoorOpen className="h-3.5 w-3.5 text-orange-400" /> <span className="hidden sm:inline">Walk in</span>
          </button>
          <button
            className={`${btn} ${touring ? '!border-orange-400 !bg-orange-500 !text-white' : ''}`}
            onClick={() => (touring ? onFree() : go('tour'))}
            disabled={!stations.length}
            aria-label={touring ? 'Stop the guided tour' : 'Start the guided tour'}
          >
            {touring ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-orange-400" />}
            <span className="hidden sm:inline">{touring ? 'Stop tour' : 'Guided tour'}</span>
          </button>
          <button className={btn} onClick={() => apiRef.current?.zoom(0.8)} aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5 text-orange-400" />
          </button>
          <button className={btn} onClick={() => apiRef.current?.zoom(1.25)} aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5 text-orange-400" />
          </button>
          <button className={btn} onClick={savePicture} aria-label="Save a picture of your venue">
            <Camera className="h-3.5 w-3.5 text-orange-400" />
          </button>
          <button className={btn} onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'}>
            {full ? <Minimize2 className="h-3.5 w-3.5 text-orange-400" /> : <Maximize2 className="h-3.5 w-3.5 text-orange-400" />}
          </button>
        </div>

        {/* bottom: selected item controls or stats */}
        {sel ? (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-400/40 bg-black/70 p-2.5 pl-4 backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{sel.title}</p>
              <p className="text-[11px] text-white/60">
                {KIND_LABEL[sel.kind]} · drag to move · R to rotate · Del to remove
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button className={btn} onClick={() => rotate(sel.uid, -Math.PI / 4)} aria-label="Rotate left">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button className={btn} onClick={() => rotate(sel.uid, Math.PI / 4)} aria-label="Rotate right">
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button className={btn} onClick={() => duplicate(sel.uid)} aria-label="Duplicate">
                <Copy className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Duplicate</span>
              </button>
              <button className={`${btn} hover:!border-red-400/70`} onClick={() => remove(sel.uid)} aria-label="Remove from venue">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button className={btn} onClick={() => setSelected(null)} aria-label="Deselect">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] text-white/75">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1 backdrop-blur">
              <Users className="h-3.5 w-3.5 text-indigo-300" /> {guests} guests · each dot ≈ {GUESTS_PER_DOT}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1 backdrop-blur">
              {stations.length} experience{stations.length === 1 ? '' : 's'} · floor {fill}% used
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1 backdrop-blur md:inline-flex">
              <Move3d className="h-3.5 w-3.5 text-orange-400" /> Drag items · drag floor to look · click to zoom with wheel
            </span>
          </div>
        )}
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

          <button
            onClick={() => autoPlan(eventType)}
            disabled={!products.length}
            className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-orange-500/25 p-3 text-left transition hover:border-violet-300 disabled:opacity-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/40">
              <Wand2 className="h-5 w-5 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">Auto-plan for me</span>
              <span className="block text-xs text-white/70">{TEMPLATES[eventType].blurb}</span>
            </span>
          </button>

          <div className="mb-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Venue type">
            {(
              [
                ['indoor', 'Indoor hall', Building2],
                ['outdoor', 'Open-air lawn', TreePine],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                role="radio"
                aria-checked={venue === v}
                onClick={() => setVenue(v)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  venue === v ? 'border-orange-400 bg-orange-500/20 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
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
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-white/55">No products match.</li>}
            {filtered.map((p) => {
              const kind = kindOf(p.title, p.category);
              const n = stations.filter((s) => s.productId === p.id).length;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 pr-3">
                  <span
                    className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${KIND_COLOR[kind]}, #1e1b4b)` }}
                  >
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" width={48} height={48} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-white/60">
                      <span style={{ color: KIND_COLOR[kind] }}>● </span>
                      {KIND_LABEL[kind]} · {p.price ? `from ${inr(Number(p.price))}` : 'Price on request'}
                    </p>
                  </div>
                  <button
                    onClick={() => addProduct(p)}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
                    aria-label={`Add ${p.title} to venue`}
                  >
                    {n ? <span>×{n}</span> : null}
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-orange-400/30 bg-gradient-to-b from-orange-500/10 to-white/[0.03] p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-400">3 · Your setup</h2>
            <div className="flex gap-2">
              <button
                onClick={tidy}
                disabled={!stations.length}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40"
              >
                <Shuffle className="h-3.5 w-3.5" /> Tidy
              </button>
              <button
                onClick={clearAll}
                disabled={!stations.length}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {stations.length === 0 ? (
            <p className="py-2 text-sm text-white/65">Nothing yet — try “Auto-plan for me” or add a product above.</p>
          ) : (
            <ul className="mb-4 space-y-1.5">
              {groups.map(({ p, n }) => (
                <li key={p.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[kindOf(p.title, p.category)] }} />
                  <span className="min-w-0 flex-1 truncate text-white/90">{p.title}</span>
                  <span className="flex items-center gap-1">
                    <button
                      onClick={() => removeOneOf(p.id)}
                      aria-label={`One fewer ${p.title}`}
                      className="rounded-full border border-white/15 p-1 text-white/75 hover:text-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">{n}</span>
                    <button
                      onClick={() => addProduct(p)}
                      aria-label={`One more ${p.title}`}
                      className="rounded-full border border-white/15 p-1 text-white/75 hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </span>
                  <span className="w-20 text-right text-xs text-white/65">{p.price ? inr(Number(p.price) * n) : 'on request'}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-white/70">
              <span>Floor space used</span>
              <span className="font-semibold text-white">{fill}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${fill > 70 ? 'bg-red-400' : fill > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${fill}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {tips.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs text-white/75">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" /> <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F7A40] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0b6634] sm:col-span-2"
            >
              <MessageCircle className="h-4 w-4" /> Send my plan on WhatsApp
            </a>
            <button
              onClick={copyLink}
              disabled={!stations.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-orange-400" />}
              {copied ? 'Link copied' : 'Copy plan link'}
            </button>
            <a
              href="tel:+919063679687"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-orange-400" /> Call us
            </a>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/50">
            <Sparkles className="h-3 w-3" /> Your plan is saved on this device automatically.
          </p>
        </section>
      </div>
    </div>
  );
}
