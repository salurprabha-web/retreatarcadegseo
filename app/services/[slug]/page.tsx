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

  // ✅ Fetch manually linked related events
  let relatedEvents: any[] = [];
  if (service.related_event_ids?.length) {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, image_url, summary, price')
      .in('id', service.related_event_ids)
      .eq('status', 'published');
    relatedEvents = data || [];
  }

  // ✅ JSON-LD Structured Data
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
      url: url,
    },
  };

  return (
    <div className="bg-white">
      {/* ✅ Inject JSON-LD for Google Rich Results */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Section */}
      <section className="relative bg-gray-50">
        {service.image_url && (
          <div className="w-full h-[450px] relative overflow-hidden">
            <Image
              src={service.image_url}
              alt={service.title}
              fill
              className="object-cover brightness-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <h1 className="text-4xl md:text-5xl font-bold">{service.title}</h1>
              {service.summary && <p className="mt-2 text-lg text-gray-200 max-w-3xl">{service.summary}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left (main info) */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          <div
            className="prose prose-lg max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: service.description }}
          />

          {/* Highlights */}
          {service.highlights && service.highlights.length > 0 && (
            <div className="bg-orange-50 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">Highlights</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {service.highlights.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gallery */}
          {service.gallery_images && service.gallery_images.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {service.gallery_images.map((img: string, i: number) => (
                  <div key={i} className="h-48 relative rounded-xl overflow-hidden">
                    <Image
                      src={img}
                      alt={`${service.title} Image ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-8">
          <div className="bg-white border rounded-xl shadow p-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Starting from</h3>
            <p className="text-3xl font-bold text-orange-600 mb-4">
              ₹{service.price_from?.toLocaleString('en-IN') || 'On Request'}
            </p>
            <a
              href="/contact"
              className="block text-center bg-orange-600 text-white font-medium py-3 rounded-lg shadow hover:bg-orange-700 transition"
            >
              Get Quote
            </a>
            <a
              href="tel:+919000000000"
              className="block text-center mt-3 border border-orange-600 text-orange-600 font-medium py-3 rounded-lg hover:bg-orange-50 transition"
            >
              Call Now
            </a>
          </div>

          <div className="bg-gray-50 border rounded-xl shadow-sm p-5">
            <h4 className="font-semibold text-lg mb-2 text-gray-800">Why Choose Us?</h4>
            <ul className="text-gray-700 space-y-2 list-disc pl-5">
              <li>Premium setup & branding</li>
              <li>On-site support staff</li>
              <li>Customizable experiences</li>
              <li>Fast installation & teardown</li>
            </ul>
          </div>
        </aside>
      </section>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Related Event Experiences</h2>
              <a
                href="/events"
                className="text-orange-600 hover:text-orange-700 font-medium transition"
              >
                View All
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedEvents.map((ev) => (
                <a
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={ev.image_url || '/default-image.jpg'}
                      alt={ev.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                      {ev.title}
                    </h3>
                    <p className="text-gray-600 mt-2 line-clamp-3">{ev.summary}</p>
                    <div className="mt-4 flex justify-between items-center text-sm">
                      {ev.price ? (
                        <span className="font-semibold text-orange-600">
                          ₹{Number(ev.price).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-gray-500">Price on Request</span>
                      )}
                      <span className="text-orange-500 font-medium">Explore →</span>
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
