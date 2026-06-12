import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getServiceBySlug } from '@/lib/services';

export const revalidate = 0;
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

// -----------------------------
// SEO METADATA
// -----------------------------
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) {
    return {
      title: 'Service Not Found | Retreat Arcade',
      description: 'The service you are looking for could not be found.',
    };
  }

  const title = service.meta_title || `${service.title} in Hyderabad | Retreat Arcade`;
  const description =
    service.meta_description ||
    service.summary ||
    service.description?.replace(/<[^>]+>/g, '').substring(0, 160);

  const imageUrl = service.image_url || `${siteUrl}/og-image.jpg`;
  const pageUrl = `${siteUrl}/services/${service.slug}`;

  return {
    title,
    description,
    // ✅ FIX: Canonical URL on every service page
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Retreat Arcade',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// -----------------------------
// PAGE COMPONENT
// -----------------------------
export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const pageUrl = `${siteUrl}/services/${service.slug}`;

  // Fetch related events
  let relatedEvents: any[] = [];
  if (Array.isArray(service.related_event_ids) && service.related_event_ids.length > 0) {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, image_url, summary, price')
      .in('id', service.related_event_ids)
      .eq('status', 'published');

    if (!error && data) relatedEvents = data;
  }

  // ✅ FIX: Enhanced JSON-LD with FAQ support + areaServed Hyderabad
  const jsonLd = service.schema_json || {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary || service.description,
    image: service.image_url ? [service.image_url] : [],
    url: pageUrl,
    areaServed: {
      '@type': 'City',
      name: 'Hyderabad',
    },
    provider: {
      '@type': 'LocalBusiness',
      name: 'Retreat Arcade',
      url: siteUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Madhapur',
        addressRegion: 'Telangana',
        postalCode: '500084',
        addressCountry: 'IN',
      },
    },
    offers: {
      '@type': 'Offer',
      price: service.price_from ? service.price_from.toString() : '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  // ✅ FIX: FAQPage schema (edit Q&As per service in Supabase, or use these defaults)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much does ${service.title} cost in Hyderabad?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: service.price_from
            ? `${service.title} starts from ₹${service.price_from.toLocaleString('en-IN')} in Hyderabad. Final pricing depends on event duration, location, and customisations. Contact us for a free quote.`
            : `Pricing for ${service.title} in Hyderabad varies based on event type, duration, and location. Contact Retreat Arcade for a custom quote.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where does Retreat Arcade provide ${service.title} in Hyderabad?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Retreat Arcade provides ${service.title} across Hyderabad including Madhapur, HITEC City, Gachibowli, Banjara Hills, Jubilee Hills, Secunderabad, and all major areas.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I book ${service.title} for my event?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can book by calling +91 9063679687, WhatsApp at +91 7993912762, or filling the contact form at retreatarcade.in/contact. We confirm bookings within 24 hours.',
        },
      },
    ],
  };

  return (
    <div className="bg-white">

      {/* STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ✅ FIX: FAQ schema for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HERO SECTION */}
      <section className="relative h-[520px] flex items-center justify-center text-center text-white overflow-hidden pt-28 md:pt-0">
        <Image
          src={service.image_url || '/default-image.jpg'}
          alt={service.title}
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/70" />
        <div className="relative z-10 px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl">
            {service.title}
          </h1>
          {service.summary && (
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 drop-shadow-lg">
              {service.summary}
            </p>
          )}
        </div>
      </section>

      {/* RELATED EVENTS */}
      {relatedEvents.length > 0 && (
        <section className="bg-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Explore Wide Range
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedEvents.map((ev) => (
                <a
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group"
                >
                  <div className="relative h-56">
                    <Image
                      src={ev.image_url || '/default-image.jpg'}
                      alt={ev.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600">
                      {ev.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3 mb-4">{ev.summary}</p>
                    <div className="flex justify-between items-center text-sm">
                      {ev.price ? (
                        <span className="font-semibold text-orange-600">
                          ₹{Number(ev.price).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-gray-500">Price on Request</span>
                      )}
                      <span className="text-orange-600 font-medium group-hover:underline">
                        Explore →
                      </span>
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
          className="text-gray-800 leading-relaxed text-lg
          [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>

      {/* ✅ FIX: FAQ section on page (visible to users + search engines) */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              How much does {service.title} cost in Hyderabad?
            </summary>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              {service.price_from
                ? `Starting from ₹${service.price_from.toLocaleString('en-IN')}. Final pricing depends on duration, location, and customisations. Contact us for a free quote.`
                : `Pricing varies by event type, duration, and location. Contact us for a personalised quote.`}
            </p>
          </details>
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              Where in Hyderabad do you provide {service.title}?
            </summary>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              We cover all of Hyderabad — Madhapur, HITEC City, Gachibowli, Banjara Hills,
              Jubilee Hills, Secunderabad, Kukatpally, Miyapur, and surrounding areas.
            </p>
          </details>
          <details className="border border-gray-200 rounded-xl p-5 open:bg-gray-50">
            <summary className="font-semibold text-gray-800 cursor-pointer">
              How do I book?
            </summary>
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
