'use client';
import React, { useEffect } from 'react';
import Hero from './Hero';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import { Service, BlogPost } from '../../types';

// FIX: Add scrollTo prop to handle anchor scrolling from parent
interface HomePageProps {
    services: Service[];
    posts: BlogPost[];
    scrollTo?: string;
}

const HomePage: React.FC<HomePageProps> = ({ services, posts, scrollTo }) => {

  // FIX: Use the scrollTo prop to handle scrolling, removing dependency on Next.js hooks
  useEffect(() => {
    const hash = scrollTo || window.location.hash.substring(1);
    if (hash) {
        setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
  }, [scrollTo]);

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
