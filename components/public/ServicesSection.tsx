import React from 'react';
import { Service } from '../../types';

interface ServicesSectionProps {
  services: Service[];
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
  return (
    <section id="services" className="py-20 bg-brand-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white font-poppins">Featured Experiences</h2>
          <p className="text-lg text-gray-400 mt-2">Curated rentals designed for sophisticated fun.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.slice(0, 2).map(service => (
            <a 
              key={service.id} 
              href={`#/services/${service.seo.slug}`}
              className="block bg-brand-dark rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
            >
              <div className="overflow-hidden">
                <img src={service.image_url} alt={service.name} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-brand-accent font-poppins mb-2">{service.name}</h3>
                <p className="text-gray-300 mb-4 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-semibold bg-brand-secondary px-3 py-1 rounded-full">{service.category}</span>
                    <span className="text-xl font-bold text-white">₹{service.price.toFixed(2)} / event</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-12">
            <a 
                href="#/services"
                className="inline-block bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-accent-hover transition-colors duration-300"
            >
                View All Experiences
            </a>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;