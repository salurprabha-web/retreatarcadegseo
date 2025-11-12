import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getServiceBySlug } from '@/lib/services';

// ✅ SEO Metadata
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
  const url = `https://www.retreatarcade.in/services/${service.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
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

// ✅ Component
export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const pageUrl = `https://www.retreatarcade.in/services/${service.slug}`;

  // ✅ Fetch mapped events
  let relatedEvents: any[] = [];
  if (service.related_event_ids?.length) {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, image_url, summary, price')
      .in('id', service.related_event_ids)
      .eq('status', 'published');
    relatedEvents = data || [];
  }

  // ✅ Structured Data
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
      {/* ✅ Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO SECTION */}
      <section className="relative h-[500px] flex items-center justify-center bg-black text-white">
        <Image
          src={service.image_url || '/default-image.jpg'}
          alt={service.title}
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">{service.title}</h1>
          {service.summary && (
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200">{service.summary}</p>
          )}
        </div>
      </section>

      {/* INTRODUCTION / DESCRIPTION */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>

      {/* HIGHLIGHTS */}
      {service.highlights?.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {service.highlights.map((item: string, i: number) => (
                <div
                  key={i}
                  className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition"
                >
                  <p className="text-lg font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {service.gallery_images?.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {service.gallery_images.map((img: string, i: number) => (
              <div key={i} className="relative h-60 rounded-xl overflow-hidden group">
                <Image
                  src={img}
                  alt={`${service.title} image ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRICING + CTA */}
      <section className="bg-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Book {service.title} for Your Event</h3>
          <p className="text-lg mb-6">
            Starting from{' '}
            <span className="font-semibold text-yellow-300">
              ₹{service.price_from?.toLocaleString('en-IN') || 'On Request'}
            </span>
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/contact"
              className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition"
            >
              Get Quote
            </a>
            <a
              href="tel:+919000000000"
              className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-orange-600 transition"
            >
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* RELATED EVENTS */}
      {relatedEvents.length > 0 && (
        <section className="bg-gray-100 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Related Event Experiences
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
    </div>
  );
}
