
import React, { useState, useMemo } from 'react';
import { Service } from '../../types';

interface ServicesPageProps {
  services: Service[];
}

const ServicesPage: React.FC<ServicesPageProps> = ({ services }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = useMemo(() => {
        const allCategories = services.map(s => s.category);
        return ['All', ...new Set(allCategories)];
    }, [services]);

    const filteredServices = useMemo(() => {
        if (selectedCategory === 'All') {
            return services;
        }
        return services.filter(s => s.category === selectedCategory);
    }, [services, selectedCategory]);

    return (
        <section id="services-page" className="py-20 bg-brand-dark">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white font-poppins">Our Experiences</h1>
                    <p className="text-lg text-gray-400 mt-2">Explore our collection of luxury rentals.</p>
                </div>

                <div className="flex justify-center flex-wrap gap-2 mb-12">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                selectedCategory === category 
                                ? 'bg-brand-accent text-brand-dark' 
                                : 'bg-brand-secondary text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredServices.map(service => (
                        <a 
                            key={service.id} 
                            href={`#/services/${service.seo.slug}`}
                            className="block bg-brand-secondary rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
                        >
                            <div className="overflow-hidden">
                                <img src={service.image_url} alt={service.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-brand-accent font-poppins mb-2 h-16">{service.name}</h3>
                                <p className="text-gray-300 mb-4 text-sm line-clamp-3 h-16">{service.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-semibold bg-brand-dark px-3 py-1 rounded-full">{service.category}</span>
                                    <span className="text-lg font-bold text-white">${service.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesPage;
