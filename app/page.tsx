import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { FeaturedEvents } from '@/components/sections/featured-events';
import { ServicesOverview } from '@/components/sections/services-overview';
import { Testimonials } from '@/components/sections/testimonials';
import { CallToAction } from '@/components/sections/cta';
import { supabase } from '@/lib/supabase';

// ✅ THIS IS THE FIX — forces Next.js to render fresh on every request
// without this, Next.js statically caches the homepage HTML at build time
// meaning metadata changes never appear until a full rebuild clears cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const metadata: Metadata = {
  title: 'Interactive Game Rentals, Photo Booths & Event Entertainment | Retreat Arcade',
  description: 'Retreat Arcade — interactive game rentals, 360° photo booths, VR simulators & team building for corporate events, college fests & weddings across India. Based in Hyderabad.',
  alternates: { canonical: siteUrl },
  openGraph: {
    title: 'Interactive Game Rentals & Event Entertainment | Retreat Arcade',
    description: 'Photo booths, interactive games, VR simulators & team building activities for events across India.',
    url: siteUrl,
  },
};

export default async function Home() {
  const { data: heroSettings } = await supabase
    .from('homepage_settings')
    .select('*')
    .maybeSingle();

  return (
    <>
      <Hero settings={heroSettings} />
      <FeaturedEvents />
      <ServicesOverview />
      <Testimonials />
      <CallToAction />
    </>
  );
}
