import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getServiceBySlug } from '@/lib/services';
import { TechServiceTemplate } from '@/components/services/tech-service-template';

export const revalidate = 0;
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: 'Service Not Found | Retreat Arcade', description: 'The service you are looking for could not be found.' };

  // CMS meta_title takes priority; fallback uses India (national pillar)
  const title = service.meta_title || `${service.title} | Event Entertainment Across India | Retreat Arcade`;
  const description = service.meta_description || service.summary || service.description?.replace(/<[^>]+>/g, '').substring(0, 160);
  const imageUrl = service.image_url || `${siteUrl}/og-image.jpg`;
  const pageUrl = service.canonical_url || `${siteUrl}/services/${service.slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title, description, type: 'website', url: pageUrl, siteName: 'Retreat Arcade', images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const pageUrl = service.canonical_url || `${siteUrl}/services/${service.slug}`;

  // Related products
  let relatedEvents: any[] = [];
  if (Array.isArray(service.related_event_ids) && service.related_event_ids.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, image_url, summary, price')
      .in('id', service.related_event_ids)
      .eq('status', 'published');
    if (data) relatedEvents = data;
  }

  // Fetch active locations for this service (for internal linking + areaServed)
  const { data: locationLinks } = await supabase
    .from('service_location_products')
    .select('locations!fk_location(id, city, slug, state, is_active)')
    .eq('service_id', service.id)
    .eq('is_enabled', true);

  // Deduplicate locations
  const seen = new Set<string>();
  const locations: any[] = [];
  for (const row of locationLinks || []) {
    const loc = (row as any).locations;
    if (loc?.is_active && !seen.has(loc.id)) {
      seen.add(loc.id);
      locations.push(loc);
    }
  }
  locations.sort((a, b) => a.city.localeCompare(b.city));

  // Service JSON-LD — areaServed = India (national pillar page)
  const isTechService = service.is_tech_service === true;

  // ✅ Cross-sell data — only fetched for tech services, since rental
  // services already have their own related-products logic below.
  let siblingServices: any[] = [];
  let complementaryProducts: any[] = [];

  if (isTechService) {
    const { data: allServices } = await supabase
      .from('services')
      .select('title, slug, summary, is_tech_service')
      .eq('status', 'published')
      .eq('is_tech_service', true)
      .neq('slug', service.slug)
      .limit(4);
    siblingServices = allServices || [];

    // Curated complementary products — things that genuinely pair with
    // event registration/check-in software at a real live event.
    const complementarySlugs = [
      'social-wall-live-event-social-media-wall-rental',
      'quiz-buzzer-system-rental',
      'digital-spin-wheel-game-rental',
    ];
    const { data: allProducts } = await supabase
      .from('events')
      .select('title, slug, image_url, price')
      .in('slug', complementarySlugs)
      .eq('status', 'published');
    complementaryProducts = allProducts || [];
  }


  const jsonLd = service.schema_json || {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary || service.description,
    image: service.image_url ? [service.image_url] : [],
    url: pageUrl,
    areaServed: { '@type': 'Country', name: 'India' },
    provider: {
      '@type': 'LocalBusiness',
      name: 'Retreat Arcade',
      url: siteUrl,
      address: { '@type': 'PostalAddress', addressLocality: 'Madhapur', addressRegion: 'Telangana', postalCode: '500084', addressCountry: 'IN' },
    },
    ...(service.price_from ? {
      offers: {
        '@type': 'Offer',
        price: service.price_from.toString(),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: pageUrl,
      },
    } : {}),
  };

  // FAQ schema — generic, not city-locked
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does ${service.title} cost?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: service.price_from
            ? `${service.title} starts from ₹${service.price_from.toLocaleString('en-IN')}. Final pricing depends on event duration, city, and customisations. Contact us for a free quote.`
            : `Pricing for ${service.title} varies by event type, duration, and city. Contact Retreat Arcade for a personalised quote.`,
        },
      },
      {
        '@type': 'Question',
        name: `Which cities does Retreat Arcade provide ${service.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: locations.length > 0
            ? `Retreat Arcade provides ${service.title} in ${locations.map(l => l.city).join(', ')} and more cities across India.`
            : `Retreat Arcade provides ${service.title} across major cities in India including Hyderabad, Bangalore, Chennai, Mumbai and more.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I book ${service.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Call or WhatsApp us at +91 9063679687, or fill out the contact form at retreatarcade.in/contact. We confirm bookings within 24 hours.',
        },
      },
    ],
  };

  // BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: service.title, item: pageUrl },
    ],
  };

  // ✅ Tech services get a completely separate template — no rental hero,
  // no Cities We Serve, no related-products grid. Schema (jsonLd, faqSchema,
  // breadcrumbSchema) is still shared since both templates need SEO markup.
  if (isTechService) {
    const faqItems = faqSchema.mainEntity.map((q: any) => ({
      question: q.name,
      answer: q.acceptedAnswer.text,
    }));

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <TechServiceTemplate
          service={service}
          faqItems={faqItems}
          siblingServices={siblingServices}
          complementaryProducts={complementaryProducts}
        />
        {/* trust_badges and key_features are already part of `service`
            object spread above — getServiceBySlug now includes them */}
      </>
    );
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* HERO */}
      <section className="relative h-[520px] flex items-center justify-center text-center text-white overflow-hidden pt-28 md:pt-0">
        <Image src={service.image_url || '/default-image.jpg'} alt={service.title} fill className="object-cover object-top" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/70" />
        <div className="relative z-10 px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl">{service.title}</h1>
          {service.summary && <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 drop-shadow-lg">{service.summary}</p>}
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedEvents.length > 0 && (
        <section className="bg-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Explore Our Range</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedEvents.map((ev) => (
                <a key={ev.id} href={`/events/${ev.slug}`} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group">
                  <div className="relative h-56">
                    <Image src={ev.image_url || '/default-image.jpg'} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600">{ev.title}</h3>
                    <p className="text-gray-600 line-clamp-3 mb-4">{ev.summary}</p>
                    <div className="flex justify-between items-center text-sm">
                      {ev.price ? <span className="font-semibold text-orange-600">₹{Number(ev.price).toLocaleString('en-IN')}</span> : <span className="text-gray-500">Price on Request</span>}
                      <span className="text-orange-600 font-medium group-hover:underline">Explore →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DESCRIPTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className="text-gray-800 leading-relaxed text-lg [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>

      {/* CITIES WE SERVE — internal links to location pages */}
      {locations.length > 0 && (
        <section className="bg-orange-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Cities We Serve</h2>
            <p className="text-center text-gray-600 mb-10">
              {service.title} available across India — click your city to explore products and pricing.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {locations.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/services/${service.slug}/${loc.slug}`}
                  className="flex items-center gap-2 bg-white border border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 hover:text-orange-700 transition group"
                >
                  <MapPin className="h-4 w-4 text-orange-400 group-hover:text-orange-600 flex-shrink-0" />
                  <span>{loc.city}</span>
                  {loc.state && <span className="text-xs text-gray-400 hidden sm:inline truncate">{loc.state}</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">How much does {service.title} cost?</summary>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              {service.price_from ? `Starting from ₹${service.price_from.toLocaleString('en-IN')}. ` : ''}
              Pricing varies by city, duration, and customisations. Contact us for a free quote.
            </p>
          </details>
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">Which cities do you cover?</summary>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              {locations.length > 0
                ? `We currently offer ${service.title} in ${locations.map(l => l.city).join(', ')}. More cities being added regularly.`
                : `We serve major cities across India. Contact us to check availability in your city.`}
            </p>
          </details>
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">How do I book?</summary>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              Call or WhatsApp us at +91 9063679687, or fill out the{' '}
              <a href="/contact" className="text-orange-600 underline">contact form</a>. We confirm within 24 hours.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
