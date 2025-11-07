'use client';

import { useEffect } from 'react';

interface ScrollHandlerProps {
  scrollTo?: string;
}

// This component handles two scrolling scenarios:
// 1. For Next.js App Router: It accepts a `scrollTo` prop from a Server Component.
// 2. For the legacy SPA: It reads `?scrollTo=` from the URL hash.
export default function ScrollHandler({ scrollTo }: ScrollHandlerProps) {
  // Logic for prop-based scrolling (for Next.js App Router)
  useEffect(() => {
    if (scrollTo) {
      // Timeout ensures element is ready after potential re-renders
      setTimeout(() => {
        const element = document.getElementById(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [scrollTo]);

  // Logic for hash-based scrolling (for legacy SPA)
  useEffect(() => {
    // If the `scrollTo` prop is provided, this logic is disabled to avoid conflicts.
    if (scrollTo !== undefined) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const targetId = params.get('scrollTo');
      
      if (targetId) {
        // Timeout ensures element is ready after potential re-renders
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Call it once on mount for the initial URL state
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [scrollTo]); // Dependency ensures this only runs when in SPA mode (no prop)

  return null; // This component renders nothing.
}
