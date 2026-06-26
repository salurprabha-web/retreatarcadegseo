// app/components/gallery-client.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

// ✅ FIX: previously typed as `images: string[]` and given fake alt text
// like "gallery-0" — but the actual data being passed in was an array of
// full media row objects ({ url, alt_text, caption, category, ... }),
// not plain URL strings. This type mismatch meant <Image src={src}>
// received an object instead of a string, which silently fails to
// render. Now correctly typed and wired to the real alt_text/caption
// fields that already exist in the database.
type MediaItem = {
  url: string;
  alt_text?: string | null;
  caption?: string | null;
  category?: string | null;
};

type Props = { images: MediaItem[]; initialIndex?: number; className?: string; thumbClass?: string };

export default function GalleryClient({ images = [], initialIndex = 0, className = '', thumbClass = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(initialIndex);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  if (!images || images.length === 0) return null;

  return (
    <div className={`gallery-component ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((item, i) => (
          <div
            key={i}
            className={`relative h-44 overflow-hidden rounded-lg cursor-pointer ${thumbClass}`}
            onClick={() => openAt(i)}
            role="button"
            tabIndex={0}
          >
            {/* ✅ Real alt text from the database, with a sensible fallback
                instead of the meaningless "gallery-0" placeholder */}
            <Image
              src={item.url}
              alt={item.alt_text || item.caption || 'Retreat Arcade event photo'}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 50vw, 280px"
              className="object-cover w-full h-full"
            />
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="absolute top-6 right-6">
            <button onClick={() => setOpen(false)} className="p-2 bg-white rounded-full" aria-label="Close gallery preview">
              <X />
            </button>
          </div>

          <div className="max-w-4xl w-full">
            <div className="relative pb-[56.25%] h-0">
              <Image
                src={images[index].url}
                alt={images[index].alt_text || images[index].caption || 'Retreat Arcade event photo'}
                fill
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setIndex((v) => (v - 1 + images.length) % images.length)}
                className="px-4 py-2 bg-white rounded"
                aria-label="Previous image"
              >
                Prev
              </button>
              <div className="text-sm text-white">
                {index + 1} / {images.length}
                {images[index].caption && <span className="ml-2 opacity-80">— {images[index].caption}</span>}
              </div>
              <button
                onClick={() => setIndex((v) => (v + 1) % images.length)}
                className="px-4 py-2 bg-white rounded"
                aria-label="Next image"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
