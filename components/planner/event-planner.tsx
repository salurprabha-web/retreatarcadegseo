'use client';

import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  Beer,
  Crown,
  Flower,
  Send,
  Soup,
  Utensils,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  DoorOpen,
  Download,
  Eye,
  Footprints,
  ImagePlus,
  Redo2,
  Share2,
  Undo2,
  Wallet,
  Flower2,
  Image as ImageIcon,
  Lightbulb,
  Maximize2,
  MessageCircle,
  Mic2,
  Minimize2,
  Minus,
  Moon,
  Move3d,
  Music,
  Palette,
  PartyPopper,
  Phone,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  ScanLine,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Sun,
  Sunset,
  Trash2,
  TreePine,
  Tv,
  Users,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  DEFAULT_CFG,
  KIND_COLOR,
  KIND_LABEL,
  KIND_RADIUS,
  GUESTS_PER_DOT,
  PRESETS,
  SERVICES,
  TEMPLATES,
  THEMES,
  WALL_COLORS,
  autoLayout,
  clampToFloor,
  decodePlan,
  describeVenue,
  dims,
  encodePlan,
  kindOf,
  resolveCollisions,
  sanitizeCfg,
  seatCount,
  walkBounds,
  wallSlots,
  WALL_ITEMS,
  type Preset,
  type Station,
  type VenueConfig,
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
const CONTACT_KEY = 'ra-3d-contact-v1';
const LOGO_KEY = 'ra-3d-logo-v1';

const STEPS = [
  { id: 'event', label: 'Event' },
  { id: 'venue', label: 'Venue' },
  { id: 'attractions', label: 'Attractions' },
  { id: 'review', label: 'Review' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

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

/* ───────── small UI pieces ───────── */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/60">{title}</p>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; t: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            value === o.v ? 'border-orange-400 bg-orange-500 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:border-orange-400/60 hover:text-white'
          }`}
        >
          {o.icon}
          {o.t}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, icon, label }: { on: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        on ? 'border-orange-400 bg-orange-500/25 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
      }`}
    >
      {icon}
      {label}
      <span className={`ml-1 h-2 w-2 rounded-full ${on ? 'bg-emerald-400' : 'bg-white/25'}`} />
    </button>
  );
}

function Section({
  id,
  open,
  onToggle,
  title,
  hint,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: (id: string) => void;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => onToggle(id)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span>
          <span className="block text-sm font-bold text-white">{title}</span>
          <span className="block text-xs text-white/55">{hint}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-5 border-t border-white/10 px-4 py-4">{children}</div>}
    </div>
  );
}

const field =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-orange-400';

/* ───────── the planner ───────── */

export function EventPlanner({ products }: { products: PlannerProduct[] }) {
  const [step, setStep] = useState<StepId>('event');
  const [openSec, setOpenSec] = useState('space');
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [guests, setGuests] = useState(150);
  const [city, setCity] = useState('Hyderabad');
  const [cfg, setCfg] = useState<VenueConfig>(DEFAULT_CFG);
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
  const [shot, setShot] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: '', phone: '', email: '', date: '', notes: '', budget: '' });
  const [quoteState, setQuoteState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [quoteErr, setQuoteErr] = useState('');
  const [hp, setHp] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoErr, setLogoErr] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [histTick, setHistTick] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<PlannerApi | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const upd = (patch: Partial<VenueConfig>) => setCfg((c) => ({ ...c, ...patch }));

  useEffect(() => {
    setGl(canUseWebGL());
    setCanShare(typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function');
  }, []);

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

  const { w, l } = dims(cfg, guests);
  const bnd = useMemo(() => walkBounds(cfg, w, l, guests), [cfg, w, l, guests]);
  const boundsRef = useRef(bnd);
  boundsRef.current = bnd;

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
    try {
      const c = JSON.parse(localStorage.getItem(CONTACT_KEY) || 'null');
      if (c && typeof c === 'object') setContact({ name: String(c.name || ''), phone: String(c.phone || ''), email: String(c.email || ''), date: String(c.date || ''), notes: String(c.notes || ''), budget: String(c.budget || '') });
    } catch {}
    try {
      const lg = localStorage.getItem(LOGO_KEY);
      if (lg && lg.startsWith('data:image/')) setLogo(lg);
    } catch {}
    const src = shared || (saved && Array.isArray(saved.s) ? (saved as ReturnType<typeof decodePlan>) : null);
    if (src) {
      if (EVENT_TYPES.includes(src.t)) setEventType(src.t);
      setGuests(src.g);
      setCity(src.c || 'Hyderabad');
      setCfg(sanitizeCfg(src.o, src.v));
      const next: Station[] = [];
      src.s.forEach(([pid, x, z, rot]) => {
        const p = byId.get(pid);
        if (p) next.push({ uid: uid(p.id), productId: p.id, title: p.title, kind: kindOf(p.title, p.category), x, z, rot });
      });
      setStations(next);
      if (shared && next.length) setStep('review');
    }
    if (addKey) {
      const p = products.find((x) => x.id === addKey || x.slug === addKey);
      if (p) {
        addProduct(p);
        setStep('attractions');
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planObject = useMemo(
    () => ({
      t: eventType,
      g: guests,
      c: city,
      v: cfg.venue,
      o: cfg,
      s: stations.map((s) => [s.productId, Math.round(s.x * 10) / 10, Math.round(s.z * 10) / 10, Math.round(s.rot * 100) / 100] as [string, number, number, number]),
    }),
    [eventType, guests, city, cfg, stations]
  );

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(planObject));
        localStorage.setItem(CONTACT_KEY, JSON.stringify(contact));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [planObject, contact, hydrated]);

  /* ───────── undo / redo ───────── */
  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  const past = useRef<Station[][]>([]);
  const future = useRef<Station[][]>([]);
  const snap = useCallback(() => {
    past.current.push(stationsRef.current);
    if (past.current.length > 40) past.current.shift();
    future.current = [];
    setHistTick((t) => t + 1);
  }, []);
  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return;
    future.current.push(stationsRef.current);
    setStations(p);
    setSelected(null);
    setHistTick((t) => t + 1);
  }, []);
  const redo = useCallback(() => {
    const n = future.current.pop();
    if (!n) return;
    past.current.push(stationsRef.current);
    setStations(n);
    setSelected(null);
    setHistTick((t) => t + 1);
  }, []);

  /* company logo: resized in the browser, never uploaded anywhere */
  const onLogoFile = (file?: File | null) => {
    setLogoErr('');
    if (!file) return;
    if (!file.type.startsWith('image/')) return setLogoErr('Please choose an image file (PNG, JPG, SVG or WebP).');
    if (file.size > 5_000_000) return setLogoErr('That image is over 5 MB. Please pick a smaller one.');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth || 512;
        const ih = img.naturalHeight || 512;
        const k = Math.min(1, 512 / Math.max(iw, ih));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(iw * k));
        c.height = Math.max(1, Math.round(ih * k));
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/png');
        setLogo(url);
        try {
          localStorage.setItem(LOGO_KEY, url);
        } catch {}
      };
      img.onerror = () => setLogoErr('We could not read that image. Try a PNG or JPG.');
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  const removeLogo = () => {
    setLogo(null);
    try {
      localStorage.removeItem(LOGO_KEY);
    } catch {}
  };

  /* ───────── station actions ───────── */
  const addProduct = (p: PlannerProduct) => {
    snap();
    const id = uid(p.id);
    setStations((prev) => {
      const kind = kindOf(p.title, p.category);
      const slots = autoLayout([...prev.map((s) => s.kind), kind], boundsRef.current);
      const slot = slots[slots.length - 1];
      const pos = resolveCollisions(slot.x, slot.z, kind, prev, boundsRef.current);
      return [...prev, { uid: id, productId: p.id, title: p.title, kind, x: pos.x, z: pos.z, rot: 0 }];
    });
    setSelected(id);
  };

  const remove = (id: string) => {
    snap();
    setStations((prev) => prev.filter((s) => s.uid !== id));
    setSelected((s) => (s === id ? null : s));
  };
  const removeOneOf = (productId: string) => {
    snap();
    setStations((prev) => {
      const i = [...prev].reverse().findIndex((s) => s.productId === productId);
      if (i < 0) return prev;
      const idx = prev.length - 1 - i;
      return prev.filter((_, k) => k !== idx);
    });
  };
  const rotate = useCallback((id: string, delta: number) => {
    snap();
    setStations((prev) => prev.map((s) => (s.uid === id ? { ...s, rot: s.rot + delta } : s)));
  }, [snap]);
  const duplicate = (id: string) => {
    const src = stations.find((s) => s.uid === id);
    const p = src && byId.get(src.productId);
    if (p) addProduct(p);
  };
  const move = useCallback((id: string, x: number, z: number) => {
    setStations((prev) => prev.map((s) => (s.uid === id ? { ...s, x, z } : s)));
  }, []);
  const tidy = () => {
    snap();
    setStations((prev) => {
      const spots = autoLayout(prev.map((s) => s.kind), boundsRef.current);
      return prev.map((s, i) => ({ ...s, ...spots[i], rot: 0 }));
    });
  };
  const clearAll = () => {
    snap();
    setStations([]);
    setSelected(null);
  };

  /** Pick a balanced starter set from the real catalogue for this event type. */
  const autoPlan = (type: string) => {
    snap();
    const t = TEMPLATES[type];
    const g = type === eventType ? guests : t.guests;
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
    const dm = dims(cfg, g);
    const spots = autoLayout(kinds, walkBounds(cfg, dm.w, dm.l, g));
    setEventType(type);
    setGuests(g);
    setStations(picked.map((p, i) => ({ uid: uid(p.id), productId: p.id, title: p.title, kind: kinds[i], x: spots[i].x, z: spots[i].z, rot: 0 })));
    setSelected(null);
    setView((v) => ({ mode: 'overview', n: v.n + 1 }));
  };

  const applyPreset = (p: Preset) => {
    setEventType(p.type);
    setGuests(p.guests);
    setCfg((c) => sanitizeCfg({ ...DEFAULT_CFG, ...p.cfg, auto: true, title: c.title, subtitle: c.subtitle, services: c.services }, p.cfg.venue ?? c.venue));
    setView((v) => ({ mode: 'overview', n: v.n + 1 }));
  };

  // keep stations on the floor when the venue changes
  useEffect(() => {
    setStations((prev) => prev.map((s) => ({ ...s, ...clampToFloor(s.x, s.z, bnd) })));
  }, [bnd]);

  // keyboard: R rotate, Delete remove, Esc deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      if (!selected) return;
      const step = e.shiftKey ? 1.5 : 0.5;
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dz = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      if (dx || dz) {
        e.preventDefault();
        snap();
        setStations((prev) => {
          const me = prev.find((q) => q.uid === selected);
          if (!me) return prev;
          const p = resolveCollisions(me.x + dx, me.z + dz, me.kind, prev.filter((q) => q.uid !== me.uid), boundsRef.current);
          return prev.map((q) => (q.uid === selected ? { ...q, x: p.x, z: p.z } : q));
        });
        return;
      }
      if (e.key === 'r' || e.key === 'R') rotate(selected, e.shiftKey ? -Math.PI / 4 : Math.PI / 4);
      else if (e.key === 'Delete' || e.key === 'Backspace') remove(selected);
      else if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, rotate, undo, redo, snap]);

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
  const usable = (bnd.x1 - bnd.x0) * (bnd.z1 - bnd.z0 + 2);
  const used = stations.reduce((a, s) => a + Math.PI * KIND_RADIUS[s.kind] ** 2, 0);
  const fill = Math.min(100, Math.round((used / usable) * 100));
  const perStation = stations.length ? Math.round(guests / stations.length) : null;
  const sqmPerGuest = (w * l) / guests;

  const tips = useMemo(() => {
    const out: string[] = [];
    const kinds = new Set(stations.map((s) => s.kind));
    if (!stations.length) return ['Add a few attractions so your guests have something to do — try “Auto-plan attractions” in step 1.'];
    if (perStation && perStation > 60) out.push(`About ${perStation} guests per attraction — add another to avoid long queues.`);
    if (fill > 70) out.push('The floor is getting crowded. Make the venue bigger or remove one attraction.');
    if (sqmPerGuest < 1.2) out.push('Under 1.2 m² per guest is very tight. Consider a bigger hall.');
    if (!kinds.has('booth') && !kinds.has('mirror') && products.some((p) => ['booth', 'mirror'].includes(kindOf(p.title, p.category))))
      out.push('Add a photo or mirror booth — it is the most-shared experience at events.');
    if (stations.length >= 2 && kinds.size === 1) out.push('Mix attraction types so every age group has something to enjoy.');
    if (!out.length) out.push('Great mix! Take the guided tour, then send it to us for a quote.');
    return out;
  }, [stations, perStation, fill, sqmPerGuest, products]);

  /* ───────── share / save / quote ───────── */
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/plan-your-event?plan=${encodePlan(planObject)}`;
  }, [planObject]);

  const missing = useMemo(() => wallSlots(cfg, w, l).missing, [cfg, w, l]);

  const venueLines = useMemo(() => describeVenue(cfg, w, l, guests), [cfg, w, l, guests]);

  const message = useMemo(() => {
    const lines = groups.map((g) => `• ${g.p.title}${g.n > 1 ? ` ×${g.n}` : ''}${g.p.price ? ` (from ${inr(Number(g.p.price))} each)` : ''}`);
    return [
      'Hi Retreat Arcade! I planned my event using your 3D planner and would like a quote.',
      '',
      contact.name ? `Name: ${contact.name}` : '',
      contact.phone ? `Phone: ${contact.phone}` : '',
      contact.email ? `Email: ${contact.email}` : '',
      `Event: ${cfg.title || eventType}${cfg.subtitle ? ` — ${cfg.subtitle}` : ''}`,
      `Type: ${eventType}`,
      contact.date ? `Date: ${contact.date}` : '',
      `Guests: ${guests}`,
      `City: ${city || '—'}`,
      Number(contact.budget) > 0 ? `Budget: ${inr(Number(contact.budget))}` : '',
      '',
      'Venue:',
      ...venueLines.map((x) => `• ${x}`),
      '',
      stations.length ? `Attractions:\n${lines.join('\n')}` : 'Attractions: (still deciding — please suggest)',
      total ? `Estimated starting total: ${inr(total)}${unpriced ? ' + items on request' : ''}` : '',
      contact.notes ? `\nNotes: ${contact.notes}` : '',
      stations.length ? `\nMy 3D layout: ${shareUrl}` : '',
    ]
      .filter((x, i, a) => x !== '' || (i > 0 && a[i - 1] !== ''))
      .join('\n');
  }, [groups, stations.length, eventType, cfg.title, cfg.subtitle, venueLines, guests, city, total, unpriced, shareUrl, contact]);

  const submitQuote = async () => {
    setQuoteErr('');
    const name = contact.name.trim();
    const phone = contact.phone.replace(/[^0-9+]/g, '');
    const email = contact.email.trim();
    if (name.length < 2) return setQuoteErr('Please enter your name.');
    if (phone.replace(/\D/g, '').length < 8) return setQuoteErr('Please enter a phone number we can call.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setQuoteErr('Please enter a valid email address.');
    if (hp) {
      // bots fill the hidden field: pretend it worked
      setQuoteState('sent');
      return;
    }
    try {
      const last = Number(sessionStorage.getItem('ra-quote-at') || 0);
      if (Date.now() - last < 45_000) return setQuoteErr('Your request was just sent. Please wait a minute before sending another.');
    } catch {}
    setQuoteState('sending');
    const { error } = await supabase.from('contact_enquiries').insert([
      {
        name,
        email,
        phone: contact.phone.trim(),
        event_type: eventType,
        message: `[3D planner quote request]\n${message}`,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.error('Quote request failed:', { message: error.message, code: error.code });
      setQuoteState('idle');
      setQuoteErr('We could not send that just now. Please use the WhatsApp button below and we will pick it up right away.');
      toast.error('Something went wrong. Please WhatsApp us directly at +91 9063679687.');
      return;
    }
    try {
      sessionStorage.setItem('ra-quote-at', String(Date.now()));
    } catch {}
    setQuoteState('sent');
    toast.success("Thanks! We've received your plan and will respond within a few hours.");
  };

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

  const downloadSummary = () => {
    const blob = new Blob([message], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-event-plan.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
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

  /* review step: grab a fresh preview of the venue */
  useEffect(() => {
    if (step !== 'review') return;
    const t = setTimeout(() => setShot(apiRef.current?.snapshot() || null), 700);
    return () => clearTimeout(t);
  }, [step, stations, cfg, guests]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const goStep = (id: StepId) => {
    setStep(id);
    panelRef.current?.scrollIntoView({ block: 'nearest' });
  };
  const toggleSec = (id: string) => setOpenSec((o) => (o === id ? '' : id));

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
              cfg={cfg}
              w={w}
              l={l}
              bounds={bnd}
              view={view}
              zoomOn={zoomOn}
              logoUrl={logo}
              onDragStart={snap}
              onSelect={setSelected}
              onMove={move}
              onTourStep={onTourStep}
              onFree={onFree}
              apiRef={apiRef}
            />
          </div>
        ) : null}

        <div className="absolute left-3 top-3 flex gap-2">
          <button className={btn} onClick={undo} disabled={!past.current.length} aria-label="Undo" title="Undo (Ctrl+Z)" data-tick={histTick}>
            <Undo2 className="h-3.5 w-3.5 text-orange-400" />
          </button>
          <button className={btn} onClick={redo} disabled={!future.current.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-3.5 w-3.5 text-orange-400" />
          </button>
        </div>

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

        {sel ? (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-400/40 bg-black/70 p-2.5 pl-4 backdrop-blur">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{sel.title}</p>
              <p className="text-[11px] text-white/60">{KIND_LABEL[sel.kind]} · drag or arrow keys to move · R to rotate · Del to remove</p>
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
              {stations.length} attraction{stations.length === 1 ? '' : 's'} · floor {fill}% used
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1 backdrop-blur md:inline-flex">
              <Move3d className="h-3.5 w-3.5 text-orange-400" /> Drag items · drag floor to look · click to zoom with wheel
            </span>
          </div>
        )}
      </div>

      {/* ───────────── Planner panel ───────────── */}
      <div ref={panelRef} className="min-w-0">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
          {/* stepper */}
          <ol className="mb-5 grid grid-cols-4 gap-1.5" aria-label="Planning steps">
            {STEPS.map((st, i) => {
              const active = st.id === step;
              const done = i < stepIndex;
              return (
                <li key={st.id}>
                  <button
                    onClick={() => goStep(st.id)}
                    aria-current={active ? 'step' : undefined}
                    className={`flex w-full flex-col items-center gap-1 rounded-2xl border px-1 py-2 text-[11px] font-semibold transition sm:text-xs ${
                      active
                        ? 'border-orange-400 bg-orange-500/20 text-white'
                        : done
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-white/85'
                        : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        active ? 'bg-orange-500 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    {st.label}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* ───── Step 1: event ───── */}
          {step === 'event' && (
            <div className="space-y-5">
              <Group title="What are you planning?">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event type">
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
              </Group>

              <Group title="Quick start — pick a ready-made venue">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-violet-300/60 hover:bg-white/[0.06]"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-white">
                        <PartyPopper className="h-4 w-4 text-violet-300" /> {p.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/60">{p.blurb}</span>
                    </button>
                  ))}
                </div>
              </Group>

              <button
                onClick={() => autoPlan(eventType)}
                disabled={!products.length}
                className="flex w-full items-center gap-3 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-600/30 to-orange-500/25 p-3 text-left transition hover:border-violet-300 disabled:opacity-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/40">
                  <Wand2 className="h-5 w-5 text-white" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">Auto-plan attractions</span>
                  <span className="block text-xs text-white/70">{TEMPLATES[eventType].blurb}</span>
                </span>
              </button>

              <div>
                <label className="mb-1 flex items-center justify-between text-sm text-white/80" htmlFor="guests">
                  <span>Guests</span>
                  <span className="text-lg font-extrabold text-white">{guests}</span>
                </label>
                <input id="guests" type="range" min={20} max={1000} step={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full accent-orange-500" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="city">
                    City
                  </label>
                  <input id="city" value={city} onChange={(e) => setCity(e.target.value)} className={field} placeholder="Hyderabad" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="edate">
                    Event date
                  </label>
                  <input id="edate" type="date" value={contact.date} onChange={(e) => setContact((c) => ({ ...c, date: e.target.value }))} className={field} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="budget">
                  Budget (optional)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/60">₹</span>
                  <input
                    id="budget"
                    inputMode="numeric"
                    value={contact.budget}
                    onChange={(e) => setContact((c) => ({ ...c, budget: e.target.value.replace(/[^0-9]/g, '').slice(0, 9) }))}
                    className={`${field} pl-7`}
                    placeholder="e.g. 150000"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs text-white/65">
                  <ImagePlus className="mr-1 inline h-3.5 w-3.5 text-amber-300" />
                  Add your company or event logo — it shows on the stage screen and photo wall. It stays on your device.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-orange-400/60 hover:text-white">
                    <ImagePlus className="h-3.5 w-3.5 text-orange-400" /> {logo ? 'Change logo' : 'Choose logo'}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => onLogoFile(e.target.files?.[0])} />
                  </label>
                  {logo && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="Your logo" className="h-9 w-auto max-w-[90px] rounded bg-white p-1 object-contain" />
                      <button onClick={removeLogo} className="text-xs font-semibold text-white/70 hover:text-white">
                        Remove
                      </button>
                    </>
                  )}
                </div>
                {logoErr && <p className="mt-2 text-xs text-red-300">{logoErr}</p>}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-xs text-white/65">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-300" />
                  Your event name appears on the stage screen in the 3D view.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={cfg.title}
                    onChange={(e) => upd({ title: e.target.value.slice(0, 44) })}
                    className={field}
                    placeholder="e.g. Priya & Rahul’s Sangeet"
                    aria-label="Event name shown on the stage screen"
                    maxLength={44}
                  />
                  <input
                    value={cfg.subtitle}
                    onChange={(e) => upd({ subtitle: e.target.value.slice(0, 60) })}
                    className={field}
                    placeholder="e.g. 14 December · Hyderabad"
                    aria-label="Second line on the stage screen"
                    maxLength={60}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ───── Step 2: venue ───── */}
          {step === 'venue' && (
            <div className="space-y-3">
              <Section id="space" open={openSec === 'space'} onToggle={toggleSec} title="Space & size" hint="Indoor or outdoor, and how big">
                <Group title="Setting">
                  <Seg
                    label="Venue setting"
                    value={cfg.venue}
                    onChange={(v) => upd({ venue: v })}
                    options={[
                      { v: 'indoor', t: 'Indoor hall', icon: <Building2 className="h-3.5 w-3.5" /> },
                      { v: 'outdoor', t: 'Open-air lawn', icon: <TreePine className="h-3.5 w-3.5" /> },
                    ]}
                  />
                </Group>
                {cfg.venue === 'outdoor' && (
                  <Group title="Time of day">
                    <Seg
                      label="Time of day"
                      value={cfg.time}
                      onChange={(v) => upd({ time: v })}
                      options={[
                        { v: 'day', t: 'Daytime', icon: <Sun className="h-3.5 w-3.5" /> },
                        { v: 'dusk', t: 'Sunset', icon: <Sunset className="h-3.5 w-3.5" /> },
                        { v: 'night', t: 'Night', icon: <Moon className="h-3.5 w-3.5" /> },
                      ]}
                    />
                  </Group>
                )}
                <Group title="Venue size">
                  <Seg
                    label="Venue size mode"
                    value={cfg.auto ? 'auto' : 'custom'}
                    onChange={(v) => upd(v === 'auto' ? { auto: true } : { auto: false, w: Math.round(w), l: Math.round(l) })}
                    options={[
                      { v: 'auto', t: 'Auto from guests' },
                      { v: 'custom', t: 'Set my own', icon: <Ruler className="h-3.5 w-3.5" /> },
                    ]}
                  />
                  {!cfg.auto && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs text-white/70">
                        Width · <span className="font-bold text-white">{Math.round(cfg.w)} m</span>
                        <input type="range" min={10} max={60} step={1} value={cfg.w} onChange={(e) => upd({ w: Number(e.target.value) })} className="mt-1 w-full accent-orange-500" />
                      </label>
                      <label className="text-xs text-white/70">
                        Length · <span className="font-bold text-white">{Math.round(cfg.l)} m</span>
                        <input type="range" min={10} max={70} step={1} value={cfg.l} onChange={(e) => upd({ l: Number(e.target.value) })} className="mt-1 w-full accent-orange-500" />
                      </label>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-white/65">
                    {Math.round(w)} m × {Math.round(l)} m · {Math.round(w * l)} m² · {sqmPerGuest.toFixed(1)} m² per guest ·{' '}
                    <span className={sqmPerGuest < 1.2 ? 'text-red-300' : sqmPerGuest < 2 ? 'text-amber-300' : 'text-emerald-300'}>
                      {sqmPerGuest < 1.2 ? 'very tight' : sqmPerGuest < 2 ? 'cosy' : sqmPerGuest < 4 ? 'comfortable' : 'spacious'}
                    </span>
                  </p>
                </Group>
              </Section>

              <Section id="stage" open={openSec === 'stage'} onToggle={toggleSec} title="Stage & seating" hint="Where the programme happens and where guests sit">
                <Group title="Stage">
                  <Seg
                    label="Stage position"
                    value={cfg.stage}
                    onChange={(v) => upd({ stage: v })}
                    options={[
                      { v: 'none', t: 'No stage' },
                      { v: 'back', t: 'Back wall', icon: <Mic2 className="h-3.5 w-3.5" /> },
                      { v: 'left', t: 'Left wall' },
                      { v: 'right', t: 'Right wall' },
                    ]}
                  />
                  {cfg.stage !== 'none' && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">Stage set</p>
                      <Seg
                        label="Stage set"
                        value={cfg.stageStyle}
                        onChange={(v) => upd({ stageStyle: v })}
                        options={[
                          { v: 'standard', t: 'Standard LED stage', icon: <Tv className="h-3.5 w-3.5" /> },
                          { v: 'mandap', t: 'Wedding mandap', icon: <Flower className="h-3.5 w-3.5" /> },
                          { v: 'reception', t: 'Reception sofa', icon: <Crown className="h-3.5 w-3.5" /> },
                        ]}
                      />
                    </div>
                  )}
                  {cfg.stage !== 'none' && (
                    <div className="mt-2">
                      <Toggle on={cfg.runway} onChange={(v) => upd({ runway: v })} icon={<Footprints className="h-3.5 w-3.5" />} label="Catwalk / runway" />
                    </div>
                  )}
                  {cfg.stage !== 'none' && (
                    <div className="mt-2">
                      <Seg
                        label="Stage size"
                        value={cfg.stageSize}
                        onChange={(v) => upd({ stageSize: v })}
                        options={[
                          { v: 'S', t: 'Small' },
                          { v: 'M', t: 'Medium' },
                          { v: 'L', t: 'Large' },
                        ]}
                      />
                    </div>
                  )}
                </Group>
                <Group title="Second stage (optional)">
                  <Seg
                    label="Second stage"
                    value={cfg.stage2}
                    onChange={(v) => upd({ stage2: v })}
                    options={[
                      { v: 'none', t: 'None' },
                      { v: 'left', t: 'Left wall' },
                      { v: 'right', t: 'Right wall' },
                    ]}
                  />
                  {cfg.stage2 !== 'none' && cfg.stage2 === cfg.stage && (
                    <p className="mt-2 text-[11px] text-amber-300">The main stage is already on that wall — pick the other side.</p>
                  )}
                </Group>
                <Group title="Seating">
                  <Seg
                    label="Seating style"
                    value={cfg.seating}
                    onChange={(v) => upd({ seating: v })}
                    options={[
                      { v: 'none', t: 'Standing only' },
                      { v: 'tables', t: 'Banquet tables', icon: <Armchair className="h-3.5 w-3.5" /> },
                      { v: 'theatre', t: 'Theatre rows' },
                      { v: 'lounge', t: 'Lounge sofas' },
                    ]}
                  />
                  {cfg.seating === 'tables' && (
                    <div className="mt-2">
                      <Seg
                        label="Seats per table"
                        value={String(cfg.tableSeats) as '4' | '6' | '8' | '10'}
                        onChange={(v) => upd({ tableSeats: Number(v) as 4 | 6 | 8 | 10 })}
                        options={[
                          { v: '4', t: '4 per table' },
                          { v: '6', t: '6 per table' },
                          { v: '8', t: '8 per table' },
                          { v: '10', t: '10 per table' },
                        ]}
                      />
                    </div>
                  )}
                  {cfg.seating !== 'none' && (
                    <label className="mt-3 block text-xs text-white/70">
                      Seated guests · <span className="font-bold text-white">{cfg.seatPct}%</span> ({seatCount(cfg, guests)} seats)
                      <input type="range" min={10} max={100} step={5} value={cfg.seatPct} onChange={(e) => upd({ seatPct: Number(e.target.value) })} className="mt-1 w-full accent-orange-500" />
                    </label>
                  )}
                </Group>
              </Section>

              <Section id="look" open={openSec === 'look'} onToggle={toggleSec} title="Lighting & look" hint="Colours, brightness, walls and floor">
                <Group title="Lighting theme">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Lighting theme">
                    {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((k) => (
                      <button
                        key={k}
                        role="radio"
                        aria-checked={cfg.theme === k}
                        onClick={() => upd({ theme: k })}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          cfg.theme === k ? 'border-orange-400 bg-orange-500/20 text-white' : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <span className="h-3.5 w-3.5 rounded-full" style={{ background: THEMES[k].swatch }} />
                        {THEMES[k].name}
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs text-white/70">
                    Brightness · <span className="font-bold text-white">{Math.round(cfg.bright * 100)}%</span>
                    <input type="range" min={50} max={150} step={5} value={Math.round(cfg.bright * 100)} onChange={(e) => upd({ bright: Number(e.target.value) / 100 })} className="mt-1 w-full accent-orange-500" />
                  </label>
                  {cfg.venue === 'indoor' && (
                    <div className="mt-2">
                      <Toggle on={cfg.beams} onChange={(v) => upd({ beams: v })} icon={<Palette className="h-3.5 w-3.5" />} label="Moving light beams" />
                    </div>
                  )}
                </Group>
                {cfg.venue === 'indoor' && (
                  <>
                    <Group title="Wall colour">
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Wall colour">
                        {(Object.keys(WALL_COLORS) as (keyof typeof WALL_COLORS)[]).map((k) => (
                          <button
                            key={k}
                            role="radio"
                            aria-checked={cfg.wall === k}
                            aria-label={WALL_COLORS[k].name}
                            title={WALL_COLORS[k].name}
                            onClick={() => upd({ wall: k })}
                            className={`h-8 w-8 rounded-full border-2 transition ${cfg.wall === k ? 'scale-110 border-orange-400' : 'border-white/25 hover:border-white/60'}`}
                            style={{ background: WALL_COLORS[k].hex }}
                          />
                        ))}
                      </div>
                    </Group>
                    <Group title="Floor">
                      <Seg
                        label="Floor finish"
                        value={cfg.floor}
                        onChange={(v) => upd({ floor: v })}
                        options={[
                          { v: 'dark', t: 'Dark gloss' },
                          { v: 'wood', t: 'Wood' },
                          { v: 'carpet', t: 'Carpet' },
                          { v: 'marble', t: 'Marble' },
                        ]}
                      />
                    </Group>
                  </>
                )}
              </Section>

              <Section id="decor" open={openSec === 'decor'} onToggle={toggleSec} title="Décor & extras" hint="Entrance, lights, dance floor, bar and more">
                <Group title="Entrance">
                  <Seg
                    label="Entrance style"
                    value={cfg.entrance}
                    onChange={(v) => upd({ entrance: v })}
                    options={[
                      { v: 'neon', t: 'Neon arch', icon: <DoorOpen className="h-3.5 w-3.5" /> },
                      { v: 'floral', t: 'Floral arch', icon: <Flower2 className="h-3.5 w-3.5" /> },
                      { v: 'balloon', t: 'Balloon arch', icon: <PartyPopper className="h-3.5 w-3.5" /> },
                    ]}
                  />
                  <div className="mt-2">
                    <Seg
                      label="Carpet"
                      value={cfg.carpet}
                      onChange={(v) => upd({ carpet: v })}
                      options={[
                        { v: 'none', t: 'No carpet' },
                        { v: 'neon', t: 'Neon runner' },
                        { v: 'red', t: 'Red carpet' },
                      ]}
                    />
                  </div>
                </Group>
                <Group title="Add to your venue">
                  <div className="flex flex-wrap gap-2">
                    <Toggle on={cfg.dance} onChange={(v) => upd({ dance: v })} icon={<Music className="h-3.5 w-3.5" />} label="Dance floor" />
                    <Toggle on={cfg.bar} onChange={(v) => upd({ bar: v })} icon={<Beer className="h-3.5 w-3.5" />} label="Bar counter" />
                    <Toggle on={cfg.photoWall} onChange={(v) => upd({ photoWall: v })} icon={<ImageIcon className="h-3.5 w-3.5" />} label="Photo wall" />
                    <Toggle on={cfg.welcome} onChange={(v) => upd({ welcome: v })} icon={<Users className="h-3.5 w-3.5" />} label="Welcome desk" />
                    <Toggle on={cfg.buffet} onChange={(v) => upd({ buffet: v })} icon={<Utensils className="h-3.5 w-3.5" />} label="Food counters" />
                    <Toggle on={cfg.vip} onChange={(v) => upd({ vip: v })} icon={<Crown className="h-3.5 w-3.5" />} label="VIP lounge" />
                    <Toggle on={cfg.fairy} onChange={(v) => upd({ fairy: v })} icon={<Lightbulb className="h-3.5 w-3.5" />} label="Fairy lights" />
                    <Toggle on={cfg.balloons} onChange={(v) => upd({ balloons: v })} icon={<PartyPopper className="h-3.5 w-3.5" />} label="Balloons" />
                    {cfg.venue === 'indoor' && <Toggle on={cfg.screens} onChange={(v) => upd({ screens: v })} icon={<Tv className="h-3.5 w-3.5" />} label="LED screens" />}
                  </div>
                  {cfg.buffet && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">Food style</p>
                      <Seg
                        label="Food style"
                        value={cfg.foodStyle}
                        onChange={(v) => upd({ foodStyle: v })}
                        options={[
                          { v: 'buffet', t: 'Buffet line', icon: <Soup className="h-3.5 w-3.5" /> },
                          { v: 'stalls', t: 'Live food stalls', icon: <Utensils className="h-3.5 w-3.5" /> },
                        ]}
                      />
                    </div>
                  )}
                  {missing.length > 0 && (
                    <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                      Not enough wall space for {missing.map((m) => WALL_ITEMS[m].name).join(', ')}. Make the venue longer or turn off an extra to fit it in.
                    </p>
                  )}
                </Group>
              </Section>

              <Section id="services" open={openSec === 'services'} onToggle={toggleSec} title="Services you need" hint="We’ll include these in your quote">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SERVICES.map((s) => {
                    const on = cfg.services.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => setCfg((c) => ({ ...c, services: c.services.includes(s.id) ? c.services.filter((x) => x !== s.id) : [...c.services, s.id] }))}
                          className={`flex w-full items-start gap-2 rounded-xl border p-2.5 text-left transition ${
                            on ? 'border-orange-400 bg-orange-500/15' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                          }`}
                        >
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-orange-400 bg-orange-500' : 'border-white/30'}`}>
                            {on && <Check className="h-3 w-3 text-white" />}
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-white">{s.name}</span>
                            <span className="block text-[11px] text-white/55">{s.hint}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <button
                onClick={() => setCfg({ ...DEFAULT_CFG, venue: cfg.venue, title: cfg.title, subtitle: cfg.subtitle })}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset venue options
              </button>
            </div>
          )}

          {/* ───── Step 3: attractions ───── */}
          {step === 'attractions' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className={`${field} pl-9`} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
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
              <ul className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                {filtered.length === 0 && <li className="py-6 text-center text-sm text-white/55">No products match.</li>}
                {filtered.map((p) => {
                  const kind = kindOf(p.title, p.category);
                  const n = stations.filter((s) => s.productId === p.id).length;
                  return (
                    <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 pr-3">
                      <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${KIND_COLOR[kind]}, #1e1b4b)` }}>
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

              <div className="rounded-2xl border border-orange-400/30 bg-orange-500/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">Added to your venue ({stations.length})</p>
                  <div className="flex gap-2">
                    <button onClick={tidy} disabled={!stations.length} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40">
                      <Shuffle className="h-3.5 w-3.5" /> Tidy
                    </button>
                    <button onClick={clearAll} disabled={!stations.length} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:text-white disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" /> Clear
                    </button>
                  </div>
                </div>
                {stations.length === 0 ? (
                  <p className="text-xs text-white/60">Nothing yet. Add products above and they appear in the 3D venue.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {groups.map(({ p, n }) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[kindOf(p.title, p.category)] }} />
                        <span className="min-w-0 flex-1 truncate text-white/90">{p.title}</span>
                        <span className="flex items-center gap-1">
                          <button onClick={() => removeOneOf(p.id)} aria-label={`One fewer ${p.title}`} className="rounded-full border border-white/15 p-1 text-white/75 hover:text-white">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">{n}</span>
                          <button onClick={() => addProduct(p)} aria-label={`One more ${p.title}`} className="rounded-full border border-white/15 p-1 text-white/75 hover:text-white">
                            <Plus className="h-3 w-3" />
                          </button>
                        </span>
                        <span className="w-20 text-right text-xs text-white/65">{p.price ? inr(Number(p.price) * n) : 'on request'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ───── Step 4: review & send ───── */}
          {step === 'review' && (
            <div className="space-y-4">
              {shot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shot} alt="Preview of your planned venue" className="h-44 w-full rounded-2xl border border-white/10 object-cover" />
              )}

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-sm font-bold text-white">
                  {cfg.title || eventType}
                  <span className="ml-2 text-xs font-normal text-white/60">
                    {guests} guests · {city || '—'}
                    {contact.date ? ` · ${contact.date}` : ''}
                  </span>
                </p>
                <ul className="space-y-1">
                  {venueLines.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-xs text-white/75">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => goStep('venue')} className="mt-2 text-xs font-semibold text-orange-300 hover:text-orange-200">
                  Edit venue
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-sm font-bold text-white">Attractions</p>
                {groups.length === 0 ? (
                  <p className="text-xs text-white/60">
                    None yet.{' '}
                    <button onClick={() => goStep('attractions')} className="font-semibold text-orange-300">
                      Add some
                    </button>{' '}
                    or let us suggest.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {groups.map(({ p, n }) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-xs text-white/80">
                        <span className="truncate">
                          {p.title}
                          {n > 1 ? ` ×${n}` : ''}
                        </span>
                        <span className="shrink-0 text-white/60">{p.price ? inr(Number(p.price) * n) : 'on request'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-white/55">Estimated starting total</p>
                    <p className="text-2xl font-extrabold text-white">{total ? inr(total) : '—'}</p>
                    {unpriced > 0 && <p className="text-[11px] text-white/55">+ {unpriced} item{unpriced > 1 ? 's' : ''} priced on request</p>}
                  </div>
                  <p className="max-w-[9.5rem] text-right text-[11px] leading-snug text-white/50">Starting prices only. Final quote depends on duration, city and customisation.</p>
                </div>
                {Number(contact.budget) > 0 && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5 text-orange-300" /> Budget {inr(Number(contact.budget))}
                      </span>
                      <span className={total > Number(contact.budget) ? 'font-semibold text-red-300' : 'font-semibold text-emerald-300'}>
                        {total > Number(contact.budget)
                          ? `${inr(total - Number(contact.budget))} over`
                          : `${inr(Number(contact.budget) - total)} left`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all ${total > Number(contact.budget) ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, (total / Number(contact.budget)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                  <span>Floor space used</span>
                  <span className="font-semibold text-white">{fill}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-all ${fill > 70 ? 'bg-red-400' : fill > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${fill}%` }} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {tips.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-white/75">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" /> <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="mb-2 text-sm font-bold text-white">Your details (optional)</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} className={field} placeholder="Your name" aria-label="Your name" autoComplete="name" />
                  <input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className={field} placeholder="Phone number" aria-label="Phone number" inputMode="tel" autoComplete="tel" />
                </div>
                <textarea
                  value={contact.notes}
                  onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))}
                  className={`${field} mt-3 min-h-[72px]`}
                  placeholder="Anything else we should know? (timings, theme, special requests)"
                  aria-label="Notes for the team"
                />
                <p className="mt-2 text-[11px] text-white/50">Stays on your device until you send it on WhatsApp.</p>
              </div>

              <div className="rounded-2xl border border-orange-400/40 bg-gradient-to-b from-orange-500/10 to-transparent p-3">
                {quoteState === 'sent' ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Request received — thank you!</p>
                      <p className="mt-0.5 text-xs text-white/70">
                        Our team will review your venue and attractions and respond within a few hours. Want a faster reply? Message us on WhatsApp below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-white">Request a quote</p>
                    <p className="mb-3 text-xs text-white/65">Send your whole plan straight to our team. We will reply with a detailed quote.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className={`${field} sm:col-span-2`} placeholder="Email address (required)" aria-label="Email address" type="email" autoComplete="email" />
                    </div>
                    {/* honeypot for bots; hidden from people */}
                    <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
                    {quoteErr && <p className="mt-2 text-xs text-red-300" role="alert">{quoteErr}</p>}
                    <button
                      onClick={submitQuote}
                      disabled={quoteState === 'sending'}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" /> {quoteState === 'sending' ? 'Sending…' : 'Send quote request'}
                    </button>
                    <p className="mt-2 text-[11px] text-white/50">Uses the name and phone above. We only use these details to reply to your enquiry.</p>
                  </>
                )}
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
                <button onClick={copyLink} disabled={!stations.length} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40">
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-orange-400" />}
                  {copied ? 'Link copied' : 'Copy plan link'}
                </button>
                <button onClick={downloadSummary} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <Download className="h-4 w-4 text-orange-400" /> Download summary
                </button>
                <button onClick={savePicture} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <Camera className="h-4 w-4 text-orange-400" /> Save picture
                </button>
                {canShare && (
                  <button
                    onClick={() => (navigator as any).share({ title: cfg.title || 'My event plan', text: 'My event plan from Retreat Arcade', url: shareUrl }).catch(() => {})}
                    disabled={!stations.length}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <Share2 className="h-4 w-4 text-orange-400" /> Share
                  </button>
                )}
                <a href="tel:+919063679687" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <Phone className="h-4 w-4 text-orange-400" /> Call us
                </a>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                <Sparkles className="h-3 w-3" /> Your plan is saved on this device automatically.
              </p>
            </div>
          )}

          {/* footer navigation */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              onClick={() => goStep(STEPS[Math.max(0, stepIndex - 1)].id)}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <p className="hidden text-center text-xs text-white/60 sm:block">
              {stations.length} attraction{stations.length === 1 ? '' : 's'}
              {total ? ` · from ${inr(total)}` : ''}
            </p>
            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => goStep(STEPS[stepIndex + 1].id)}
                className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Next: {STEPS[stepIndex + 1].label} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => goStep('event')}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
