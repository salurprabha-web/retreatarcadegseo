'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Photo = { url: string; alt: string; caption?: string };

/** Every photo at its natural shape, tap to enlarge, arrows to move between them. */
export function CaseGallery({ photos, title = 'Photos from the event' }: { photos: Photo[]; title?: string }) {
  const [at, setAt] = useState<number | null>(null);

  useEffect(() => {
    if (at === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(null);
      if (e.key === 'ArrowRight') setAt((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setAt((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [at, photos.length]);

  if (!photos.length) return null;
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold text-white">{title}</h2>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>figure]:mb-4 [&>figure]:break-inside-avoid">
        {photos.map((p, i) => (
          <figure key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.alt} loading="lazy" onClick={() => setAt(i)} className="h-auto w-full cursor-zoom-in rounded-2xl transition hover:opacity-90" />
            {p.caption && <figcaption className="mt-2 text-sm text-white/60">{p.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {at !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setAt(null)} role="dialog" aria-modal="true">
          <button className="absolute right-5 top-5 p-2 text-white" aria-label="Close" onClick={() => setAt(null)}><X size={30} /></button>
          {photos.length > 1 && (
            <>
              <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setAt((at - 1 + photos.length) % photos.length); }}><ChevronLeft size={28} /></button>
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setAt((at + 1) % photos.length); }}><ChevronRight size={28} /></button>
            </>
          )}
          <div className="max-h-[92vh] max-w-full text-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[at].url} alt={photos[at].alt} className="mx-auto max-h-[82vh] max-w-full rounded-xl object-contain" />
            {photos[at].caption && <p className="mt-3 text-sm text-white/75">{photos[at].caption}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
