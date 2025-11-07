import React, { useState, useEffect } from 'react';
import { GalleryImage } from '../../types';
import { createClient } from '@/lib/supabase/client';

// Fix: Instantiate Supabase client
const supabase = createClient();

const GallerySection: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);

    useEffect(() => {
        const fetchImages = async () => {
            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8); // Fetch latest 8 images for the homepage
            if (error) {
                console.error("Error fetching gallery images:", error);
            } else {
                setImages(data);
            }
        };
        fetchImages();
    }, []);

  return (
    <section id="gallery" className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white font-poppins">Events in Action</h2>
          <p className="text-lg text-gray-400 mt-2">See how we elevate experiences.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-lg shadow-lg group">
                    <img 
                        src={image.image_url} 
                        alt={image.alt_text} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300 aspect-square"
                    />
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;