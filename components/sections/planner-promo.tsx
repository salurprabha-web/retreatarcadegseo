import Link from 'next/link';
import { ZoneChip } from '@/components/world/zone';
import { ArrowRight, Box, MousePointer2, Calculator, MessageCircle } from 'lucide-react';

export function PlannerPromo() {
  const steps = [
    { icon: Box, title: 'Build your venue', text: 'Set your guest count and watch the 3D floor resize.' },
    { icon: MousePointer2, title: 'Drag products in', text: 'Photo booths, VR and arcade games — place them anywhere.' },
    { icon: Calculator, title: 'See a live estimate', text: 'Starting prices add up as you plan.' },
    { icon: MessageCircle, title: 'Send it to us', text: 'One tap and your plan lands on our WhatsApp.' },
  ];
  return (
    <section className="relative overflow-hidden px-0 py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-[2rem] p-8 md:p-14">
          <ZoneChip className="mb-5">Zone 04 · Photo Studio</ZoneChip>
          <h2 className="text-shadow-soft mb-4 max-w-2xl text-4xl font-bold text-white md:text-6xl">Design your event in 3D before you book</h2>
          <p className="mb-10 max-w-2xl text-lg text-white/75">
            Don&apos;t imagine it — see it. Lay out your venue, try different products and get a starting estimate in minutes.
          </p>
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mb-1 text-sm font-bold text-white">
                  {i + 1}. {title}
                </p>
                <p className="text-sm text-white/65">{text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/plan-your-event"
            data-magnetic="1" className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.8)] transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Start planning <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
