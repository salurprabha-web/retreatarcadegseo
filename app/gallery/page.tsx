import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { GalleryClient } from '@/components/gallery-client';

export const metadata: Metadata = {
  title: 'Gallery - Aaradhya Events',
  description: 'Browse through our collection of memorable events and celebrations',
};

export const dynamic = 'force-dynamic';

async function getGalleryImages() {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }

  console.log('Gallery images fetched:', data?.length || 0);
  return data || [];
}

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div className="min-h-screen bg-charcoal-950">
      <div
        className="relative h-96 flex items-center justify-center bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900"
      >
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
        <GalleryClient images={images} />
      </div>
    </div>
  );
}
