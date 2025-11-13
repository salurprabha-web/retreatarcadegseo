"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Props { images: string[]; }

export default function GalleryLightbox({ images }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // listen for clicks on gallery thumbnails (if you kept the button on parent)
  useEffect(() => {
    function handler(e: any) {
      const target = e.target as HTMLElement;
      const idxAttr = target.closest("button")?.getAttribute("data-img-index");
      if (idxAttr) {
        setIndex(parseInt(idxAttr, 10));
        setOpen(true);
      }
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!images || images.length === 0) return null;

  function prev() { setIndex((i) => (i - 1 + images.length) % images.length); }
  function next() { setIndex((i) => (i + 1) % images.length); }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            aria-label="close"
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ×
          </button>

          <div className="max-w-[95vw] max-h-[95vh] relative">
            <button onClick={prev} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-4xl z-10">‹</button>
            <div className="w-[90vw] h-[70vh] sm:w-[80vw] sm:h-[80vh] relative">
              <Image src={images[index]} alt={`gallery ${index+1}`} fill style={{ objectFit: "contain" }} />
            </div>
            <button onClick={next} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-4xl z-10">›</button>
          </div>
        </div>
      )}
    </>
  );
}
