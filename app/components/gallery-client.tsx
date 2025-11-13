// app/components/gallery-client.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

type Props = { images: string[]; initialIndex?: number; className?: string; thumbClass?: string };

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
        {images.map((src, i) => (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <div key={i} className={`relative h-44 overflow-hidden rounded-lg ${thumbClass}`} onClick={() => openAt(i)} role="button" tabIndex={0}>
            <Image src={src} alt={`gallery-${i}`} fill className="object-cover w-full h-full" />
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
          <div className="absolute top-6 right-6">
            <button onClick={() => setOpen(false)} className="p-2 bg-white rounded-full">
              <X />
            </button>
          </div>

          <div className="max-w-4xl w-full">
            <div className="relative pb-[56.25%] h-0">
              <Image src={images[index]} alt={`preview-${index}`} fill className="object-contain" />
            </div>

            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setIndex((v) => (v - 1 + images.length) % images.length)} className="px-4 py-2 bg-white rounded">Prev</button>
              <div className="text-sm text-white">{index + 1} / {images.length}</div>
              <button onClick={() => setIndex((v) => (v + 1) % images.length)} className="px-4 py-2 bg-white rounded">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
