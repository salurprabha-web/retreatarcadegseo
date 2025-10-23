import React, { useState, useEffect } from 'react';
import { Service, SiteSettings } from '../../types';

interface ServiceDetailPageProps {
    service: Service;
    allServices: Service[];
    settings: SiteSettings;
}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ service, allServices, settings }) => {
    const allImages = [service.image_url, ...service.gallery_image_urls].filter(Boolean);
    const [activeImage, setActiveImage] = useState(service.image_url);
    
    useEffect(() => {
        setActiveImage(service.image_url);
        window.scrollTo(0, 0);
    }, [service]);

    const relatedServices = allServices.filter(s => service.related_service_ids.includes(s.id));

    return (
        <div className="py-12 md:py-20">
            <div className="container mx-auto px-6">
                <a href="#/services" className="mb-8 text-brand-accent hover:text-brand-accent-hover font-semibold flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to All Services
                </a>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Image Gallery */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 rounded-lg overflow-hidden bg-brand-secondary aspect-video flex items-center justify-center">
                             <img src={activeImage} alt={service.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {allImages.map((img, index) => (
                                <button key={index} onClick={() => setActiveImage(img)} className={`rounded-md overflow-hidden aspect-square border-2 ${activeImage === img ? 'border-brand-accent' : 'border-transparent'}`}>
                                    <img src={img} alt={`${service.name} thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Service Info */}
                    <div className="lg:col-span-2">
                        <span className="text-sm text-gray-400 font-semibold bg-brand-secondary px-3 py-1 rounded-full">{service.category}</span>
                        <h1 className="text-4xl md:text-5xl font-bold text-white font-poppins my-4">{service.name}</h1>
                        <p className="text-2xl font-semibold text-brand-accent mb-6">${service.price.toFixed(2)} / event</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a 
                                href="#/contact"
                                className="flex-1 text-center bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-accent-hover transition-colors duration-300"
                            >
                                Inquire Now
                            </a>
                            <a 
                                href={`tel:${settings.phone_number.replace(/\D/g,'')}`}
                                className="flex-1 text-center bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-700 transition-colors duration-300 flex items-center justify-center gap-2"
                            >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                Call Us
                            </a>
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-3">Or call us at {settings.phone_number}</p>
                        
                        <div className="mt-8 pt-6 border-t border-gray-700">
                             <h3 className="text-xl font-semibold text-white mb-3 font-poppins">About This Experience</h3>
                             <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{service.long_description}</p>
                        </div>
                    </div>
                </div>
                
                {/* Features & Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 pt-12 border-t border-gray-800">
                     <div>
                        <h3 className="text-2xl font-semibold text-white mb-4 font-poppins">Key Features</h3>
                        <ul className="space-y-3">
                            {service.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-brand-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h3 className="text-2xl font-semibold text-white mb-4 font-poppins">Specifications</h3>
                        <div className="bg-brand-secondary rounded-lg p-4">
                            <ul className="space-y-2">
                                {service.specifications.map((spec, index) => (
                                    <li key={index} className="flex justify-between text-gray-300 text-sm border-b border-gray-700/50 py-2 last:border-0">
                                        <span className="font-semibold text-gray-400">{spec.key}</span>
                                        <span>{spec.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Similar Services */}
                {relatedServices.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-gray-800">
                        <h2 className="text-3xl font-bold text-white font-poppins text-center mb-8">Similar Experiences</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                           {relatedServices.map(related => (
                                <a 
                                    key={related.id} 
                                    href={`#/services/${related.seo.slug}`}
                                    className="block bg-brand-secondary rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer group"
                                >
                                    <img src={related.image_url} alt={related.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-brand-accent font-poppins mb-2">{related.name}</h3>
                                        <p className="text-gray-300 mb-4 text-sm line-clamp-2">{related.description}</p>
                                    </div>
                                </a>
                           ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ServiceDetailPage;
