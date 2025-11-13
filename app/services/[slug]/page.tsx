import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getServiceBySlug } from '@/lib/services';

export const revalidate = 0;
export const dynamic = "force-dynamic";

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

  const title = service.meta_title || `${service.title} | Retreat Arcade`;
  const description =
    service.meta_description ||
    service.summary ||
    service.description?.replace(/<[^>]+>/g, '').substring(0, 160);

  const imageUrl = service.image_url || '/default-image.jpg';
  const pageUrl = `https://www.retreatarcade.in/services/${service.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Retreat Arcade',
      images: [imageUrl],
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

  const pageUrl = `https://www.retreatarcade.in/services/${service.slug}`;

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

  // JSON-LD (Structured Data)
  const jsonLd = service.schema_json || {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.summary || service.description,
    image: service.image_url ? [service.image_url] : [],
    provider: {
      '@type': 'Organization',
      name: 'Retreat Arcade - Event Games & Photobooth Rentals',
      url: 'https://www.retreatarcade.in',
    },
    offers: {
      '@type': 'Offer',
      price: service.price_from ? service.price_from.toString() : '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  return (
    <div className="bg-white">

      {/* STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ----------------------------- */}
      {/* HERO SECTION WITH GRADIENT    */}
      {/* ----------------------------- */}
      <section className="relative h-[480px] flex items-center justify-center text-center text-white overflow-hidden">

        {/* Background Image */}
        <Image
          src={service.image_url || '/default-image.jpg'}
          alt={service.title}
          fill
          className="object-cover"
          priority
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/30" />

        {/* Hero Content */}
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

      {/* ----------------------------- */}
      {/* RELATED EVENTS                */}
      {/* ----------------------------- */}
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

      {/* ----------------------------- */}
      {/* DESCRIPTION SECTION           */}
      {/* ----------------------------- */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className="text-gray-800 leading-relaxed text-lg
          [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>

    </div>
  );
}
