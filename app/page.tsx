import { Hero } from '@/components/sections/hero';
import { FeaturedEvents } from '@/components/sections/featured-events';
import { ServicesOverview } from '@/components/sections/services-overview';
import { Testimonials } from '@/components/sections/testimonials';
import { CallToAction } from '@/components/sections/cta';

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
