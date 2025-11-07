'use client';

import { useState } from 'react';

interface EventImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function EventImage({ src, alt, className, fallbackSrc }: EventImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const defaultFallback = 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200';

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc(fallbackSrc || defaultFallback);
      }}
    />
  );
}

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function GalleryImage({ src, alt, className }: GalleryImageProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setIsVisible(false);
      }}
    />
  );
}
