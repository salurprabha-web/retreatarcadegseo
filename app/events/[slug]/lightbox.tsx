"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { GalleryImage } from "@/components/event-image";

export default function Lightbox({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState<string | null>(null);

  if (!images?.length) return null;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            onClick={() => setActive(src)}
            className="w-full h-44 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
            alt={`${title} gallery ${i + 1}`}
          />
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
