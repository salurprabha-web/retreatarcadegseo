import React, { useState, useEffect } from 'react';
import Hero from './Hero';
import ServicesSection from './ServicesSection';
import GallerySection from './GallerySection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import ScrollHandler from './ScrollHandler';
import Loader from '../common/Loader';

import { createClient } from '../../lib/supabase/client';
import { Service, BlogPost, HeroSlide, GalleryImage, Testimonial } from '../../types';

export default function HomePage() {
    const [data, setData] = useState({
        services: [] as Service[],
        blogPosts: [] as BlogPost[],
        slides: [] as HeroSlide[],
        images: [] as GalleryImage[],
        testimonials: [] as Testimonial[],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const supabase = createClient();
    
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const servicesPromise = supabase.from('services').select('*').order('created_at').limit(2).returns<Service[]>();
                const blogPostsPromise = supabase.from('blog_posts').select('*').eq('status', 'Published').order('publish_date', { ascending: false }).returns<BlogPost[]>();
                const slidesPromise = supabase.from('hero_slides').select('*').order('created_at').returns<HeroSlide[]>();
                const imagesPromise = supabase.from('gallery_images').select('*').order('created_at', { ascending: false }).limit(8).returns<GalleryImage[]>();
                const testimonialsPromise = supabase.from('testimonials').select('*').order('date', { ascending: false }).limit(3).returns<Testimonial[]>();

                const [
                    { data: services, error: servicesError }, 
                    { data: blogPosts, error: blogError },
                    { data: slides, error: slidesError },
                    { data: images, error: imagesError },
                    { data: testimonials, error: testimonialsError }
                ] = await Promise.all([
                    servicesPromise,
                    blogPostsPromise,
                    slidesPromise,
                    imagesPromise,
                    testimonialsPromise,
                ]);

                if (servicesError) throw servicesError;
                if (blogError) throw blogError;
                if (slidesError) throw slidesError;
                if (imagesError) throw imagesError;
                if (testimonialsError) throw testimonialsError;

                setData({
                    services: services || [],
                    blogPosts: blogPosts || [],
                    slides: slides || [],
                    images: images || [],
                    testimonials: testimonials || []
                });

            } catch(e: any) {
                console.error("Homepage fetch error:", e.message);
                setError(`Failed to load page data: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
    }
    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
    }

    return (
        <>
            <ScrollHandler />
            <Hero slides={data.slides} />
            <ServicesSection services={data.services} />
            <GallerySection images={data.images} />
            <TestimonialsSection testimonials={data.testimonials} />
            <BlogSection posts={data.blogPosts} />
            <ContactSection />
        </>
    );
}