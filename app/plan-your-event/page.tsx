import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { EventPlanner, type PlannerProduct } from '@/components/planner/event-planner';

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const metadata: Metadata = {
  title: 'Plan Your Event in 3D | Retreat Arcade',
  description:
    'Build your event in an interactive 3D venue: choose photo booths, VR, arcade games and team building, see an instant starting estimate and send your plan on WhatsApp.',
  alternates: { canonical: `${siteUrl}/plan-your-event` },
  openGraph: {
    title: 'Plan Your Event in 3D | Retreat Arcade',
    description: 'Drag photo booths, VR simulators and arcade games into a 3D venue and get an instant starting estimate.',
    url: `${siteUrl}/plan-your-event`,
  },
};

async function getProducts(): Promise<PlannerProduct[]> {
  const { data } = await supabase
    .from('events')
    .select('id, title, slug, price, category, image_url')
    .eq('status', 'published')
    .order('category', { ascending: true })
    .order('title', { ascending: true });
  return (data as PlannerProduct[]) || [];
}

export default async function PlanYourEventPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen">
      <div className="relative isolate overflow-hidden px-4 pb-8 pt-28 text-center">
        
        <span className="mb-3 inline-block rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-300">
          Interactive 3D planner
        </span>
        <h1 className="mb-3 text-4xl font-extrabold text-white md:text-6xl">Plan Your Event in 3D</h1>
        <p className="mx-auto max-w-2xl text-lg text-white/75">
          Pick your event type and guest count, drop our photo booths, VR simulators and arcade games into a live 3D
          venue, and get an instant starting estimate — then send the plan straight to our team.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <EventPlanner products={products} />

        <section className="mx-auto mt-16 max-w-3xl text-white/70">
          <h2 className="mb-3 text-2xl font-bold text-white">How the 3D event planner works</h2>
          <p className="mb-3">
            Choose the kind of event you&apos;re hosting and how many guests are coming — the venue floor resizes to match.
            Add any of our event entertainment products and drag each one where you want it. Prices shown are starting
            prices; your final quote depends on event duration, city and customisation.
          </p>
          <p>
            When you&apos;re happy with the layout, send it to Retreat Arcade on WhatsApp and we&apos;ll confirm
            availability and a full quote for Hyderabad and across India.
          </p>
        </section>
      </div>
    </div>
  );
}
