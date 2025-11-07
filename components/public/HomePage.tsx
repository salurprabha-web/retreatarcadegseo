import React, { useEffect } from 'react';
import Hero from './Hero';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import { Service, BlogPost } from '../../types';

// FIX: Added scrollTo to props to handle anchor links
interface HomePageProps {
    services: Service[];
    posts: BlogPost[];
    scrollTo?: string;
}

const HomePage: React.FC<HomePageProps> = ({ services, posts, scrollTo }) => {
  // FIX: Added useEffect to handle scrolling to anchor links
  useEffect(() => {
    if (scrollTo) {
        // A slight delay to ensure sections are rendered before scrolling
        setTimeout(() => {
            const element = document.getElementById(scrollTo);
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