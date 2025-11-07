'use client';
import React, { useEffect } from 'react';
import Hero from './Hero';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import { Service, BlogPost } from '../../types';
import { useSearchParams } from 'next/navigation';

interface HomePageProps {
    services: Service[];
    posts: BlogPost[];
    scrollTo?: string; // For server-side passed scroll target
}

const HomePage: React.FC<HomePageProps> = ({ services, posts, scrollTo }) => {
  const searchParams = useSearchParams();
  const clientScrollTo = searchParams.get('scrollTo');
  
  useEffect(() => {
    const targetId = scrollTo || clientScrollTo;
    if (targetId) {
        // Timeout ensures the element is available in the DOM after hydration
        setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
  }, [scrollTo, clientScrollTo]);

  return (
    <>
      <Hero />
      <ServicesSection services={services} />
      <GallerySection />
      <TestimonialsSection />
      <BlogSection posts={posts} />
      <ContactSection />
    </>
  );
};

export default HomePage;
