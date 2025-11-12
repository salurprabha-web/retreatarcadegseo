import { Metadata } from 'next';
import { getServiceBySlug } from '@/lib/services';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    slug: string;
  };
}

// ✅ SEO Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
    service.description?.substring(0, 160);
  const keywords = service.meta_keywords || [];

  const imageUrl = service.image_url || '/default-image.jpg';
  const url = `https://www.retreatarcade.in/services/${service.slug}`;

  return {
    title,
    description,
    keywords,
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

// ✅ Default Export – Service Page Component
export default async function ServiceDetailPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);

  if (!service) {
    notFound();
  }

  // ✅ Structured Data (JSON-LD)
  const jsonLd = service.schema_json || {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.summary || service.description,
    "image": service.image_url ? [service.image_url] : [],
    "provider": {
      "@type": "Organization",
      "name": "Retreat Arcade - Event Games & Photobooth Rentals",
      "url": "https://www.retreatarcade.in"
    },
    "areaServed": {
      "@type": "Place",
      "name": "India"
    },
    "offers": {
      "@type": "Offer",
      "price": service.price_from ? service.price_from.toString() : "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `https://www.retreatarcade.in/services/${service.slug}`
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Inject JSON-LD for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Service Image */}
      {service.image_url && (
        <div className="relative w-full h-[400px] mb-8 rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={service.image_url}
            alt={service.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {service.title}
      </h1>

      {/* Summary */}
      {service.summary && (
        <p className="text-lg text-gray-700 mb-6">{service.summary}</p>
      )}

      {/* Description (HTML safe render) */}
      {service.description && (
        <div
          className="prose max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      )}

      {/* Highlights */}
      {service.highlights && service.highlights.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Highlights</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {service.highlights.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional Pricing Section */}
      {service.price_from && (
        <div className="mt-10">
          <p className="text-lg font-medium text-gray-800">
            Starting from ₹{service.price_from.toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
}
