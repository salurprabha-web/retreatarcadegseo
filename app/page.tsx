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
  // ✅ FIX (Rank Math: "title has 77 characters, most search engines
  // truncate beyond 75"): trimmed to 63 chars, keeping the strongest
  // keywords Rank Math itself identified (interactive, event,
  // entertainment) plus the brand name, comfortably under the limit.
  title: 'Interactive Game Rentals & Event Entertainment | Retreat Arcade',
  // ✅ FIX (Rank Math: "meta description is 172 characters, most search
  // engines truncate beyond 160"): trimmed to 155 chars, same keywords
  // and message, fits cleanly within Google's display limit so the
  // full description shows in search results instead of being cut off
  // mid-sentence.
  description: 'Interactive game rentals, 360° photo booths, VR simulators & team building for corporate events, college fests & weddings across India. Based in Hyderabad.',
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
