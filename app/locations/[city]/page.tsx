import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, MessageCircle, Box, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ZoneHero, Panel } from '@/components/world/zone';
import { supabase } from '@/lib/supabase';
import { CITIES, getCity } from '@/lib/cities';
import { getPublishedServices } from '@/lib/services';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

// Cached and refreshed every 5 minutes: fast for visitors and for Googlebot.
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const city = getCity(params.city);
  if (!city) return { title: 'Not Found | Retreat Arcade' };
  const url = `${siteUrl}/locations/${city.slug}`;
  return {
    title: city.metaTitle,
    description: city.metaDescription,
    keywords: city.keywords,
    alternates: { canonical: url },
    openGraph: { title: city.metaTitle, description: city.metaDescription, url, siteName: 'Retreat Arcade', type: 'website' },
    twitter: { card: 'summary_large_image', title: city.metaTitle, description: city.metaDescription },
  };
}

const OTHER_CITY_WORDS = ['hyderabad', 'visakhapatnam', 'vizag', 'chennai', 'bangalore', 'mumbai', 'pune'];

type Product = { id: string; title: string; slug: string; summary: string | null; image_url: string | null; price: number | null; category: string | null };

export default async function CityPage({ params }: { params: { city: string } }) {
  const city = getCity(params.city);
  if (!city) notFound();

  const [{ data: productRows }, services, { data: linkRows }] = await Promise.all([
    supabase.from('events').select('id, title, slug, summary, image_url, price, category').eq('status', 'published').order('title'),
    getPublishedServices(),
    // service categories that already have a dedicated page for this city
    supabase
      .from('service_location_seo')
      .select('services!inner(slug,status,is_tech_service), locations!inner(slug,is_active)')
      .eq('locations.slug', city.slug),
  ]);

  const products = ((productRows as Product[]) || []).filter((p) => p.slug);
  const featured = [...products].sort((a, b) => Number(!!b.image_url) - Number(!!a.image_url)).slice(0, 12);
  const cityServiceSlugs = new Set<string>(
    ((linkRows as any[]) || [])
      .filter((r) => r.services?.status === 'published' && !r.services?.is_tech_service && r.locations?.is_active)
      .map((r) => r.services.slug)
  );
  const displayName = city.alias ? `${city.name} (${city.alias})` : city.name;
  const url = `${siteUrl}/locations/${city.slug}`;
  const wa = `https://wa.me/917993912762?text=${encodeURIComponent(`Hi Retreat Arcade! I'm planning an event in ${city.name}${city.alias ? ` (${city.alias})` : ''}. Can you share availability and a quote?`)}`;
  const others = CITIES.filter((c) => c.slug !== city.slug);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Interactive game, photo booth and VR rentals in ${displayName}`,
      serviceType: 'Event entertainment rental',
      description: city.metaDescription,
      url,
      provider: { '@type': 'Organization', name: 'Retreat Arcade', url: siteUrl },
      areaServed: {
        '@type': 'City',
        name: city.name,
        ...(city.alias ? { alternateName: city.alias } : {}),
        containedInPlace: { '@type': 'AdministrativeArea', name: city.state },
        geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: city.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Locations', item: `${siteUrl}/locations` },
        { '@type': 'ListItem', position: 3, name: city.name, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {jsonLd.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />
      ))}

      <ZoneHero
        crumbs={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/locations" className="hover:text-white transition">Locations</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{city.name}</span>
          </nav>
        }
        chip={`${city.state} · Event entertainment`}
        title={`Game, Photobooth & VR Rentals in ${displayName}`}
        description={city.heroLine}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/plan-your-event?city=${city.slug}`}
            data-magnetic="1"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.8)] transition hover:bg-orange-600"
          >
            <Box className="h-4 w-4" /> Plan your {city.name} event in 3D
          </Link>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic="1"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F7A40] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#0b6634]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp us
          </a>
        </div>
      </ZoneHero>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-24 sm:px-6 lg:px-8">
        <Panel className="p-7 sm:p-10">
          <h2 className="mb-4 text-3xl font-bold text-white">Event entertainment in {displayName}</h2>
          <div className="space-y-4 text-lg leading-relaxed text-white/80">
            {city.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Panel>

        {featured.length > 0 && (
          <section aria-labelledby="products-h">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 id="products-h" className="text-3xl font-bold text-white">
                What you can book for your {city.name} event
              </h2>
              <Link href="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-300 hover:text-orange-200">
                See all {products.length} products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <li key={p.id}>
                  <Link href={`/events/${p.slug}`} className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1">
                    <span className="relative block aspect-[4/3] w-full overflow-hidden bg-white/5">
                      {p.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={`${p.title} rental in ${city.name}`}
                          width={640}
                          height={480}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </span>
                    <span className="flex flex-1 flex-col p-4">
                      {p.category && <span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-orange-300">{p.category}</span>}
                      <span className="mb-1 text-lg font-bold text-white">{p.title}</span>
                      {p.summary && <span className="line-clamp-2 text-sm text-white/65">{p.summary}</span>}
                      <span className="mt-3 text-sm font-semibold text-white/80">{p.price ? `From ₹${Number(p.price).toLocaleString('en-IN')}` : 'Price on request'}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="occasions-h">
          <h2 id="occasions-h" className="mb-6 text-3xl font-bold text-white">
            Events we cover in {city.name}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {city.occasions.map((o) => (
              <li key={o.title} className="glass rounded-2xl p-5">
                <h3 className="mb-2 text-lg font-bold text-white">{o.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{o.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <Panel className="p-7 sm:p-10">
          <h2 className="mb-2 flex items-center gap-2 text-3xl font-bold text-white">
            <MapPin className="h-6 w-6 text-orange-400" /> Areas we serve in {city.name}
          </h2>
          <p className="mb-5 text-white/75">We provide event entertainment across {city.name}, including:</p>
          <ul className="mb-8 flex flex-wrap gap-2">
            {city.areas.map((a) => (
              <li key={a} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/85">
                {a}
              </li>
            ))}
          </ul>
          <h3 className="mb-3 text-lg font-bold text-white">Venues we work with</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {city.venues.map((v) => (
              <li key={v} className="flex items-start gap-2 text-white/80">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> {v}
              </li>
            ))}
          </ul>
        </Panel>

        {services.length > 0 && (
          <section aria-labelledby="services-h">
            <h2 id="services-h" className="mb-6 text-3xl font-bold text-white">
              Services for {city.name} events
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services
                .filter((s: any) => !s.is_tech_service)
                // a service whose name is tied to another city (e.g. '... Hyderabad') is not shown on this city's page
                .filter((s: any) => {
                  const t = `${s.title} ${s.slug}`.toLowerCase();
                  return !OTHER_CITY_WORDS.some((w) => w !== city.slug && t.includes(w));
                })
                .map((s: any) => (
                  <li key={s.id}>
                    <Link
                      href={cityServiceSlugs.has(s.slug) ? `/services/${s.slug}/${city.slug}` : `/services/${s.slug}`}
                      className="glass flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-white transition hover:text-orange-200"
                    >
                      <span className="font-semibold">
                        {s.title}
                        {cityServiceSlugs.has(s.slug) ? ` in ${city.name}` : ''}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-orange-300" />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="mb-6 text-3xl font-bold text-white">
            {city.name} event rental questions
          </h2>
          <div className="space-y-3">
            {city.faqs.map((f) => (
              <details key={f.q} className="glass group rounded-2xl p-5">
                <summary className="cursor-pointer list-none pr-6 text-lg font-semibold text-white">{f.q}</summary>
                <p className="mt-3 leading-relaxed text-white/75">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <Panel className="p-7 text-center sm:p-10">
          <h2 className="mb-3 text-3xl font-bold text-white">Ready to plan your {city.name} event?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-white/75">
            Build your venue in 3D, add attractions, and send us the plan. We will reply with availability and a quote.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/plan-your-event?city=${city.slug}`}
              data-magnetic="1"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              <Box className="h-4 w-4" /> Open the 3D planner
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic="1"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F7A40] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#0b6634]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
          </div>
          {others.length > 0 && (
            <p className="mt-6 text-sm text-white/60">
              Also see:{' '}
              {others.map((o, i) => (
                <span key={o.slug}>
                  {i > 0 && ' · '}
                  <Link href={`/locations/${o.slug}`} className="font-semibold text-orange-300 hover:text-orange-200">
                    Events in {o.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
