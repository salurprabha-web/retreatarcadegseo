'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { GalleryImage } from '@/components/event-image';
import { convertToDirectImageUrl } from '@/lib/image-utils';

interface MediaItem {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  category: string;
  filename: string;
}

interface GalleryClientProps {
  images: MediaItem[];
}

export function GalleryClient({ images }: GalleryClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(images.map(img => img.category)))];

  const filteredImages = selectedCategory === 'All'
    ? images
    : images.filter(img => img.category === selectedCategory);

  return (
    <>
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors px-4 py-2 ${
              selectedCategory === category
                ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white border-terracotta-500'
                : 'hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 border-terracotta-500/30 text-cream-100'
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-cream-300 text-lg">
            No images found. Please add images in the admin panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => {
            const imageUrl = convertToDirectImageUrl(image.url);
            return (
              <div
                key={image.id}
                className="group relative h-80 overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 border border-terracotta-500/20"
              >
                <GalleryImage
                  src={imageUrl}
                  alt={image.alt_text || image.filename}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-terracotta-500 hover:bg-terracotta-600 mb-2">
                      {image.category}
                    </Badge>
                    {image.caption && (
                      <p className="text-cream-50 text-sm mt-2">{image.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
