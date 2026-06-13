import type { Metadata } from 'next';
import { getPublishedEvents } from '@/lib/events';
import { EventsGrid } from './events-grid';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Interactive Game & Event Rental Products | Retreat Arcade',
  description: 'Browse photo booths, interactive games, VR simulators, AI experiences and event entertainment products for rent across India. Starting from ₹3,500.',
  alternates: { canonical: `${siteUrl}/events` },
  openGraph: { title: 'Event Rental Products | Retreat Arcade', url: `${siteUrl}/events` },
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full mb-4">
            {events.length}+ Products Available
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Event Rental Products
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Photo booths, interactive games, VR simulators & AI experiences for corporate events, weddings, college fests and brand activations across India.
          </p>
        </div>
      </div>

      {/* ── Grid with filters ─────────────────────────────────────────────────── */}
      <EventsGrid events={events} />

    </div>
  );
}
