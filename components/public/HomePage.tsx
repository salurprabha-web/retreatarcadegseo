import React, { useEffect } from 'react';
import Hero from './Hero';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import { Service, BlogPost } from '../../types';

interface HomePageProps {
    scrollTo?: string;
    services: Service[];
    posts: BlogPost[];
}

const HomePage: React.FC<HomePageProps> = ({ scrollTo, services, posts }) => {

  useEffect(() => {
    if (scrollTo) {
        const timer = setTimeout(() => {
            const element = document.getElementById(scrollTo);
            if (element) {
                const headerOffset = 80; // Approximate height of the sticky header
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;
      
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                });
            }
        }, 100); 
        return () => clearTimeout(timer);
    } else {
        window.scrollTo(0,0);
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
