import React, { useState, useEffect } from 'react';
import { HeroSlide } from '../../types';
import { supabase } from '../../services/supabaseClient';

const Hero: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
      const fetchSlides = async () => {
          const { data, error } = await supabase.from('hero_slides').select('*').order('created_at').returns<HeroSlide[]>();
          if (error) {
              console.error("Error fetching hero slides:", error);
          } else {
              setSlides(data || []);
          }
      };
      fetchSlides();
  }, []);

  useEffect(() => {
    if (!slides || slides.length === 0) return;

    const currentSlide = slides[currentIndex];
    
    if (currentSlide.type === 'image') {
      const timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
      }, currentSlide.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, slides]);

  if (!slides || slides.length === 0) {
    return (
      <section id="home" className="relative h-screen flex items-center justify-center text-center bg-brand-secondary">
        <p className="text-gray-400">Loading hero section...</p>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section id="home" className="relative h-screen flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={index !== currentIndex}
          >
            {slide.type === 'video' ? (
              <video
                key={slide.id}
                className="w-full h-full object-cover"
                src={slide.background_url}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${slide.background_url})`,
                  animation: index === currentIndex ? `kenburns ${slide.duration}s ease-out forwards` : 'none',
                }}
              >
                 <img src={slide.background_url} alt={slide.alt_text} className="sr-only" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black opacity-60 z-10"></div>
      
      <div className="relative z-20 px-6">
        <div key={currentIndex} className="animate-fade-in-up">
            <h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white font-poppins leading-tight"
              dangerouslySetInnerHTML={{ __html: currentSlide.headline }}
            >
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
              {currentSlide.subheadline}
            </p>
            <a 
              href={currentSlide.cta_link}
              className="mt-8 inline-block bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-accent-hover transition-colors duration-300 transform hover:scale-105"
            >
              {currentSlide.cta_text}
            </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
