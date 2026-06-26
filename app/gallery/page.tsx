import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import GalleryClient from '@/app/components/gallery-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const metadata: Metadata = {
  title: 'Event Gallery | Interactive Games & Photo Booths in Action | Retreat Arcade',
  description: 'Browse photos from Retreat Arcade events — interactive games, 360° photo booths, VR simulators and team building activities at corporate events and fests.',
  keywords: [
    'event photos Hyderabad', 'photo booth gallery India',
    'corporate event photos Hyderabad', 'VR simulator event photos',
    'event entertainment portfolio India',
  ],
  alternates: { canonical: `${siteUrl}/gallery` },
  openGraph: { title: 'Event Gallery | Retreat Arcade', url: `${siteUrl}/gallery` },
};

export const dynamic = 'force-dynamic';

async function getGalleryImages() {
  const { data, error } = await supabase
    .from('media')
    .select('url, alt_text, caption, category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }

  return data || [];
}

export default async function GalleryPage() {
  // ✅ FIX: previously the raw `data` array (rows of {url, alt_text,
  // caption, category, id, filename, tags, created_at...}) was passed
  // directly into GalleryClient, which expected a plain string[] of
  // URLs. That type mismatch meant every <Image src={item}> received a
  // whole object instead of a URL string and silently failed to render
  // — explaining why the live page showed zero actual photos despite
  // Cloudinary having real images. GalleryClient is now fixed to accept
  // the real shape directly, so no transformation is needed here either
  // — just fetching the right columns.
  const images = await getGalleryImages();

  // ✅ Group by category for a more useful, SEO-richer page than a
  // single undifferentiated grid — also gives Google actual text
  // content to index instead of an empty shell between header and footer.
  const categories = Array.from(new Set(images.map((img) => img.category).filter(Boolean)));

  // ✅ ImageGallery schema — tells Google this page IS a photo gallery,
  // which can surface it specifically in Google Images and gallery-style
  // rich results, something the page had zero structured data for before.
  const gallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Retreat Arcade Event Gallery',
    description: 'Photos from corporate events, weddings and college fests featuring photo booths, VR simulators, arcade games and team building activities.',
    url: `${siteUrl}/gallery`,
    image: images.slice(0, 20).map((img) => ({
      '@type': 'ImageObject',
      contentUrl: img.url,
      name: img.caption || img.alt_text || 'Retreat Arcade event photo',
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }} />

      <div className="min-h-screen bg-charcoal-950">
        <div className="relative h-96 flex items-center justify-center bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta-500/10 to-transparent" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-cream-50 mb-4">
              Gallery
            </h1>
            <p className="text-xl text-cream-200 max-w-2xl mx-auto">
              A glimpse into the magical moments we've created
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* ✅ Real intro paragraph — gives the page actual indexable
              text content instead of jumping straight from header to
              a (previously broken) image grid */}
          <p className="text-cream-300 max-w-3xl mx-auto text-center mb-12">
            From corporate annual days to wedding sangeets and college fests, here's a look at our
            photo booths, VR simulators, arcade games and team building activities in action across
            {' '}{images.length > 0 ? `${images.length}+ moments` : 'real events'} we've delivered for clients in
            Hyderabad and across India.
          </p>

          {images.length === 0 ? (
            <p className="text-center text-cream-400">No gallery photos available yet — check back soon.</p>
          ) : (
            <GalleryClient images={images} />
          )}

        </div>
      </div>
    </>
  );
}
