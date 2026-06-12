import type { Metadata } from 'next';
import { Hero } from '@/components/sections/hero';
import { FeaturedEvents } from '@/components/sections/featured-events';
import { ServicesOverview } from '@/components/sections/services-overview';
import { Testimonials } from '@/components/sections/testimonials';
import { CallToAction } from '@/components/sections/cta';

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

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedEvents />
      <ServicesOverview />
      <Testimonials />
      <CallToAction />
    </>
  );
}
