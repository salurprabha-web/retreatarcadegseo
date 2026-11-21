import { OurWorkGrid } from '@/components/our-work-grid';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ZoneHero } from '@/components/world/zone';
import { getPublishedCaseStudies } from '@/lib/case-studies';
import { supabase } from '@/lib/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Our Work | Real Events by Retreat Arcade',
  description: 'Real events we have delivered: photo booths, games and VR at corporate events, weddings and college fests. See photos and how each event went.',
  alternates: { canonical: `${siteUrl}/our-work` },
  openGraph: { title: 'Our Work | Retreat Arcade', description: 'Photos and stories from real events we have delivered.', url: `${siteUrl}/our-work` },
};

export default async function OurWorkPage() {
  const items = await getPublishedCaseStudies({ limit: 100 });
  // the whole section stays hidden until the first case study is published
  if (!items.length) notFound();

  const { data: cityRows } = await supabase.from('locations').select('slug, city');
  const cityNames: Record<string, string> = {};
  ((cityRows as any[]) || []).forEach((c) => { cityNames[c.slug] = c.city; });

  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Our Work', url: `${siteUrl}/our-work`,
    hasPart: items.slice(0, 20).map((i) => ({ '@type': 'Article', headline: i.title, url: `${siteUrl}/our-work/${i.slug}`, image: i.photos[0]?.url })),
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ZoneHero
        crumbs={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Our work</span>
          </nav>
        }
        chip="Real events"
        title="Our Work"
        description="Photo booths, games and VR at real corporate events, weddings and college fests. Here is how they went."
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <OurWorkGrid items={items.map((c) => ({ slug: c.slug, title: c.title, event_type: c.event_type, city_slug: c.city_slug, event_date: c.event_date, photo: c.photos[0] ? { url: c.photos[0].url, alt: c.photos[0].alt } : null }))} cityNames={cityNames} />
      </div>
    </div>
  );
}
