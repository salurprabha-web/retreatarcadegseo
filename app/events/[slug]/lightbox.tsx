"use client";

import { FitImage } from '@/components/fit-image';
import { useState } from "react";
import { X } from "lucide-react";
import { GalleryImage } from "@/components/event-image";

export default function Lightbox({ images, title, alts }: { images: string[]; title: string; alts?: string[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (!images?.length) return null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((src, i) => (
          <div key={i} onClick={() => setActive(src)} className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg bg-black/30">
            <FitImage src={src} alt={alts?.[i] || `${title} gallery ${i + 1}`} />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setActive(null)}
        >
          <button className="absolute top-6 right-6 text-white p-2">
            <X size={32} />
          </button>

          <img
            src={active}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            alt="Preview"
          />
        </div>
      )}
    </>
  );
}
