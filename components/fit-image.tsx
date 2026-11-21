'use client';

import { useState } from 'react';

const FALLBACK = 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200';

/**
 * Shows the WHOLE picture inside a frame (nothing is cut off). The empty space around a tall or wide photo is
 * filled with a soft blurred copy of the same photo. Put it inside a frame that is `relative overflow-hidden`
 * and has a height or an aspect ratio; add `group` on a parent for the gentle hover zoom.
 */
export function FitImage({ src, alt, className = '', zoom = true }: { src: string; alt: string; className?: string; zoom?: boolean }) {
  const [url, setUrl] = useState(src);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setUrl(FALLBACK)}
        className={`relative h-full w-full object-contain ${zoom ? 'transition-transform duration-500 group-hover:scale-[1.04]' : ''} ${className}`}
      />
    </>
  );
}
