import Hero from '@/components/public/Hero';
import ServicesSection from '@/components/public/ServicesSection';
import GallerySection from '@/components/public/GallerySection';
import TestimonialsSection from '@/components/public/TestimonialsSection';
import BlogSection from '@/components/public/BlogSection';
import ContactSection from '@/components/public/ContactSection';
import ScrollHandler from '@/components/public/ScrollHandler';

import { createClient } from '@/lib/supabase/server';
import { Service, BlogPost, HeroSlide, GalleryImage, Testimonial } from '@/types';

export default async function Page({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const supabase = createClient();

  // Fetch all data in parallel for efficiency
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

  if (servicesError) console.error("Homepage services fetch error:", servicesError.message);
  if (blogError) console.error("Homepage blog fetch error:", blogError.message);
  if (slidesError) console.error("Homepage hero slides fetch error:", slidesError.message);
  if (imagesError) console.error("Homepage gallery images fetch error:", imagesError.message);
  if (testimonialsError) console.error("Homepage testimonials fetch error:", testimonialsError.message);


  // This logic is to handle anchor links passed via query params, e.g. /?scrollTo=contact
  const scrollTo = typeof searchParams?.scrollTo === 'string' ? searchParams.scrollTo : undefined;

  return (
    <>
      <ScrollHandler scrollTo={scrollTo} />
      <Hero slides={slides || []} />
      <ServicesSection services={services || []} />
      <GallerySection images={images || []} />
      <TestimonialsSection testimonials={testimonials || []} />
      <BlogSection posts={blogPosts || []} />
      <ContactSection />
    </>
  );
}