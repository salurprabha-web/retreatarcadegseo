'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ScrollHandlerProps {
  scrollTo?: string;
}

export default function ScrollHandler({ scrollTo }: ScrollHandlerProps) {
  const searchParams = useSearchParams();
  const clientScrollTo = searchParams.get('scrollTo');
  
  useEffect(() => {
    const targetId = scrollTo || clientScrollTo;
    if (targetId) {
        // A small timeout ensures the element is definitely in the DOM after hydration.
        const timer = setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }
  }, [scrollTo, clientScrollTo]);

  return null; // This component renders nothing.
}
