// app/events/[slug]/[location]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { convertToDirectImageUrl } from '@/lib/image-utils';
import dynamicImport from 'next/dynamic';

type Props = { params: { slug: string; location: string } };

// FIXED dynamic import syntax
const GalleryClient = dynamicImport(
  () => import('@/app/components/gallery-client').then(m => m.default),
  { ssr: false }
);

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getEventBySlug(slug: string) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: 'Event Not Found | Retreat Arcade' };

  const location = params.location.replace(/-/g, ' ');
  const formattedLocation = location.charAt(0).toUpperCase() + location.slice(1);

  const title = `Best ${event.title} in ${formattedLocation} – Affordable Prices`;

  return {
    title,
    description:
      event.meta_description ||
      event.summary ||
      event.description?.replace(/<[^>]+>/g, '').slice(0, 160),

    openGraph: {
      title,
      description:
        event.meta_description ||
        event.summary ||
        event.description?.replace(/<[^>]+>/g, '').slice(0, 160),
      images: event.image_url ? [event.image_url] : [],
      url: `https://www.retreatarcade.in/events/${event.slug}/${params.location}`
    }
  };
}

export default async function EventLocationPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) return notFound();

  const locationSlug = params.location;
  const locationName = locationSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images.map(convertToDirectImageUrl);
    } else if (typeof event.gallery_images === 'string') {
      const arr = JSON.parse(event.gallery_images);
      if (Array.isArray(arr)) galleryImages = arr.map(convertToDirectImageUrl);
    }
  } catch {
    galleryImages = [];
  }

  const featuredImage =
    event.image_url ? convertToDirectImageUrl(event.image_url) : '/default-image.jpg';

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${event.title} - ${locationName}`,
    description: event.summary || event.description,
    image: event.image_url ? [event.image_url] : [],
    offers: event.price
      ? {
          '@type': 'Offer',
          price: String(event.price),
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `https://www.retreatarcade.in/events/${event.slug}/${locationSlug}`
        }
      : undefined
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-cream-50 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-xl border h-[50vh] relative">
          <Image src={featuredImage} alt={event.title} fill className="object-contain" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-charcoal-900 p-6 rounded-xl shadow border sticky top-28 space-y-6">
            {event.price && (
              <div className="border p-4 rounded-xl flex items-center bg-charcoal-800">
                <span className="text-gold-400 text-2xl font-bold">₹</span>
                <div className="ml-2">
                  <p className="text-cream-400 text-sm">Starting From</p>
                  <p className="text-cream-50 text-xl font-bold">
                    {Number(event.price).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            <a
              href="tel:+919063679687"
              className="block text-center bg-terracotta-500 hover:bg-terracotta-600 text-white py-3 rounded-lg"
            >
              Call to Inquire
            </a>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-charcoal-900 p-6 rounded-xl border">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div
              className="prose prose-invert max-w-none text-cream-300"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-charcoal-900 p-6 rounded-xl border">
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              <GalleryClient images={galleryImages} />
            </article>
          )}

          <section>
            <h3 className="text-3xl font-bold text-cream-50 mb-6">More from Retreat Arcade</h3>
            <Link href="/services/photobooth-rentals" className="text-terracotta-400 underline">
              View all photobooth services
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
}
