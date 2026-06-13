'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, SlidersHorizontal, Phone, MessageCircle } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Event = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  price?: number;
  image_url?: string;
  category?: string;
};

type Props = { events: Event[] };

// ── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Photobooth':       'bg-violet-100 text-violet-700',
  'Interactive Games':'bg-blue-100   text-blue-700',
  'AI Experiences':   'bg-pink-100   text-pink-700',
  'Arcade Games':     'bg-green-100  text-green-700',
  'Digital Games':    'bg-cyan-100   text-cyan-700',
  'VR Games':         'bg-indigo-100 text-indigo-700',
};
const fallbackColor = 'bg-orange-100 text-orange-700';

// ── Client component (filters need interactivity) ──────────────────────────────
export function EventsGrid({ events }: Props) {
  const [search, setSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(events.map(e => e.category).filter(Boolean))) as string[];
    return ['All', ...cats.sort()];
  }, [events]);

  const filtered = useMemo(() => events.filter(e => {
    const matchCat = activeCategory === 'All' || e.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || (e.summary || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  }), [events, activeCategory, search]);

  return (
    <div>
      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1 min-w-0">
            <SlidersHorizontal className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    activeCategory === cat
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <span className="flex-shrink-0 text-xs text-gray-400 font-medium">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 text-sm">Try a different category or search term</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="mt-4 text-sm text-orange-600 font-medium hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((event) => {
              const catColor = CAT_COLORS[event.category || ''] || fallbackColor;
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col"
                >
                  {/* ── Image container: flexible height, image always fully visible ── */}
                  <div className="relative bg-gray-50 flex items-center justify-center overflow-hidden"
                    style={{ minHeight: '200px' }}>
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-auto max-h-[260px] object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center text-gray-300 text-4xl">📸</div>
                    )}
                    {/* Category badge over image */}
                    {event.category && (
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
                        {event.category}
                      </span>
                    )}
                    {/* Price badge over image */}
                    {event.price && (
                      <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
                        ₹{Number(event.price).toLocaleString('en-IN')}+
                      </span>
                    )}
                  </div>

                  {/* ── Card body ──────────────────────────────────────────────── */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-orange-600 transition line-clamp-2">
                      {event.title}
                    </h3>

                    {event.summary && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                        {event.summary}
                      </p>
                    )}

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                      {event.price ? (
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xs text-gray-400">from</span>
                          <span className="text-base font-extrabold text-orange-600 ml-1">
                            ₹{Number(event.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Price on request</span>
                      )}
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500 group-hover:gap-1.5 transition-all">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Bottom CTA strip ────────────────────────────────────────────────── */}
        <div className="mt-16 bg-gradient-to-br from-charcoal-900 to-charcoal-950 rounded-3xl p-8 text-center">
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-2">Can't find what you need?</p>
          <h3 className="text-2xl font-bold text-white mb-2">Let's build a custom package</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            We have more products and can combine multiple activities for your event. Talk to us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="tel:+919063679687"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition text-sm shadow-lg shadow-orange-900/30">
              <Phone className="h-4 w-4" /> Call Us
            </Link>
            <a href="https://wa.me/917993912762" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-6 rounded-xl transition text-sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
