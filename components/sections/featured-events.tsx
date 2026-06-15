'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  price: number | null;
  image_url: string | null;
  category: string;
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">Top Picks</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Featured Products
            </h2>
          </div>
          <Link href="/events"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="bg-[#07091a] flex items-center justify-center overflow-hidden" style={{ minHeight: '200px' }}>
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-auto max-h-[240px] object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-white/20 text-5xl">📸</div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1 gap-2">
                {event.category && (
                  <span className="self-start text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                    {event.category}
                  </span>
                )}
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition leading-snug line-clamp-2">
                  {event.title}
                </h3>
                {event.summary && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                    {event.summary}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  {event.price ? (
                    <p className="font-extrabold text-orange-600">
                      ₹{Number(event.price).toLocaleString('en-IN')}+
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Price on request</span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-semibold text-orange-500 group-hover:gap-2 transition-all">
                    View <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-[#07091a] hover:bg-gray-900 text-white font-bold py-3.5 px-8 rounded-2xl transition text-sm"
          >
            Browse All 65+ Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
