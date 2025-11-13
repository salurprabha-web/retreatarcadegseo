// app/services/[slug]/[location]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { convertToDirectImageUrl } from '@/lib/image-utils';
import dynamicImport from 'next/dynamic';

type Props = { params: { slug: string; location: string } };

// FIXED dynamic import
const GalleryClient = dynamicImport(
  () => import('@/app/components/gallery-client').then(m => m.default),
  { ssr: false }
);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getServiceBySlug(slug: string) {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: 'Service Not Found | Retreat Arcade' };

  const location = params.location.replace(/-/g, ' ');
  const formattedLocation = location.charAt(0).toUpperCase() + location.slice(1);

  const title = `Best ${service.title} in ${formattedLocation} – Affordable Prices`;
  const desc =
    service.meta_description ||
    service.summary ||
    service.description?.replace(/<[^>]+>/g, '').slice(0, 160);

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: service.image_url ? [service.image_url] : [],
      url: `https://www.retreatarcade.in/services/${service.slug}/${params.location}`
    }
  };
}

export default async function ServiceLocationPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return notFound();

  const locationSlug = params.location;
  const locationName = locationSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(service.gallery_images)) {
      galleryImages = service.gallery_images.map(convertToDirectImageUrl);
    } else if (typeof service.gallery_images === 'string') {
      const arr = JSON.parse(service.gallery_images);
      if (Array.isArray(arr)) galleryImages = arr.map(convertToDirectImageUrl);
    }
  } catch {
    galleryImages = [];
  }

  const featuredImage =
    service.image_url ? convertToDirectImageUrl(service.image_url) : '/default-image.jpg';

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.title} - ${locationName}`,
    description: service.summary || service.description,
    image: service.image_url ? [service.image_url] : [],
    offers: {
      '@type': 'Offer',
      price: service.price_from ? String(service.price_from) : undefined,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://www.retreatarcade.in/services/${service.slug}/${locationSlug}`
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-xl border h-[50vh] relative">
          <Image src={featuredImage} alt={service.title} fill className="object-contain" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-xl shadow border sticky top-28 space-y-6">
            {service.price_from && (
              <div className="border p-4 rounded-xl flex items-center">
                <span className="text-2xl font-bold">₹</span>
                <div className="ml-2">
                  <p className="text-gray-500 text-sm">Starting From</p>
                  <p className="font-bold text-lg">
                    ₹{Number(service.price_from).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            <a
              href="tel:+919063679687"
              className="block text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg"
            >
              Call to Book
            </a>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-xl p-6 shadow border">
            <h2 className="text-2xl font-bold mb-4">Service Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: service.description }} />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-white rounded-xl p-6 shadow border">
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              <GalleryClient images={galleryImages} />
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
