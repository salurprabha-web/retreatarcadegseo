import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin, ArrowRight } from 'lucide-react';
import { ZoneHero } from '@/components/world/zone';
import { CITIES } from '@/lib/cities';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Cities We Serve | Event Game & Photobooth Rentals | Retreat Arcade',
  description: 'Interactive game, photo booth and VR rentals for events in Hyderabad and Visakhapatnam (Vizag). Pick your city to see local areas, services and FAQs.',
  alternates: { canonical: `${siteUrl}/locations` },
  openGraph: {
    title: 'Cities We Serve | Retreat Arcade',
    description: 'Event entertainment rentals in Hyderabad and Visakhapatnam (Vizag).',
    url: `${siteUrl}/locations`,
  },
};

export default function LocationsPage() {
  return (
    <div className="min-h-screen">
      <ZoneHero
        crumbs={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Locations</span>
          </nav>
        }
        chip="Cities we serve"
        title="Event Entertainment by City"
        description="Choose your city to see the areas we cover, the attractions you can book, and answers to common questions."
      />
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {CITIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/locations/${c.slug}`} className="glass group flex h-full flex-col rounded-3xl p-7 transition hover:-translate-y-1">
                <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-300">
                  <MapPin className="h-4 w-4" /> {c.state}
                </span>
                <h2 className="mb-2 text-3xl font-bold text-white">
                  {c.name}
                  {c.alias ? <span className="ml-2 text-xl font-semibold text-white/60">({c.alias})</span> : null}
                </h2>
                <p className="mb-5 text-white/75">{c.heroLine}</p>
                <p className="mb-5 text-sm text-white/60">Areas include {c.areas.slice(0, 5).join(', ')} and more.</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-orange-300 group-hover:text-orange-200">
                  Events in {c.name} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
