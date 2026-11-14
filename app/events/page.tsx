import { ZoneHero } from '@/components/world/zone';
import type { Metadata } from 'next';
import { getPublishedEvents } from '@/lib/events';
import { EventsGrid } from './events-grid';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Interactive Game & Event Rental Products | Retreat Arcade',
  description: 'Browse photo booths, interactive games, VR simulators, AI experiences and event entertainment products for rent across India. Starting from ₹3,500.',
  // ✅ FIX: same missing-keywords issue.
  keywords: [
    'event rental products India', 'photo booth rental Hyderabad',
    'interactive game rental India', 'VR simulator rental Hyderabad',
    'event entertainment products', 'corporate event rentals India',
  ],
  alternates: { canonical: `${siteUrl}/events` },
  openGraph: { title: 'Event Rental Products | Retreat Arcade', url: `${siteUrl}/events` },
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  // ✅ ItemList schema — helps Google show individual products in rich results
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Event Rental Products — Retreat Arcade",
    description: "Interactive game rentals, photo booths, VR simulators and event entertainment products in Hyderabad",
    numberOfItems: events.length,
    itemListElement: events.slice(0, 20).map((event: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      name: event.title,
      url: `https://www.retreatarcade.in/events/${event.slug}`,
      ...(event.price && {
        offers: {
          "@type": "Offer",
          price: String(event.price),
          priceCurrency: "INR",
        },
      }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    <div className="min-h-screen">

      <ZoneHero
        chip={`Zone 02 · Games Floor · ${events.length}+ Products`}
        title="Event Rental Products"
        description="Photo booths, interactive games, VR simulators & AI experiences for corporate events, weddings, college fests and brand activations across India."
      />
      {/* ── Grid with filters ─────────────────────────────────────────────────── */}
      <EventsGrid events={events} />

    </div>
    </>
  );
}
