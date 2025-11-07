'use client';
import { useEffect } from 'react';

// FIX: Add interface for props to accept `scrollTo` from server components.
interface ScrollHandlerProps {
  scrollTo?: string;
}

export default function ScrollHandler({ scrollTo }: ScrollHandlerProps) {
  useEffect(() => {
    // This function will be reused to perform the scroll
    const performScroll = (targetId: string | null) => {
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
    
    // Handle the prop from SSR first, as it's the initial server-rendered state
    if (scrollTo) {
      performScroll(scrollTo);
    }
    
    // Then handle hash changes for client-side navigation
    const handleHashChange = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const targetId = params.get('scrollTo');
      // Only scroll if the target is from a hash and not the same as the SSR prop
      if (targetId && targetId !== scrollTo) {
        performScroll(targetId);
      }
    };

    // Call it once on mount for initial hash state
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [scrollTo]); // Rerun if the prop changes

  return null; // This component renders nothing.
}
