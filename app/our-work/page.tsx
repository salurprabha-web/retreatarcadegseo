import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, CalendarDays } from 'lucide-react';
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
  const cityName = new Map(((cityRows as any[]) || []).map((c) => [c.slug, c.city as string]));

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
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <li key={c.slug}>
              <Link href={`/our-work/${c.slug}`} className="glass group flex h-full flex-col overflow-hidden rounded-3xl transition hover:-translate-y-1">
                {c.photos[0] && (
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photos[0].url} alt={c.photos[0].alt} width={640} height={480} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </span>
                )}
                <span className="flex flex-1 flex-col p-5">
                  {c.event_type && <span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-orange-300">{c.event_type}</span>}
                  <span className="mb-2 text-lg font-bold text-white">{c.title}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                    {c.city_slug && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{cityName.get(c.city_slug) || c.city_slug}</span>}
                    {c.event_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(c.event_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
