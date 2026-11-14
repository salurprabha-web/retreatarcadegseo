import { ZoneHero } from '@/components/world/zone';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TiltCard } from '@/components/three/tilt-card';
import { ArrowRight, Phone, MessageCircle, ChevronRight } from 'lucide-react';
import { getPublishedServices } from '@/lib/services';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Event Services in Hyderabad – Interactive Games, Photo Booths & More | Retreat Arcade',
  description:
    'Explore Retreat Arcade\'s full range of event services in Hyderabad — interactive game rentals, 360° photo booths, team building, brand activation, conference engagement, and product launch experiences.',
  // ✅ FIX: same missing-keywords issue.
  keywords: [
    'event services Hyderabad', 'corporate event services India',
    'team building activities Hyderabad', 'brand activation services India',
    'event registration software India', 'live streaming events service',
  ],
  alternates: { canonical: `${siteUrl}/services` },
  openGraph: {
    title: 'Event Services in Hyderabad | Retreat Arcade',
    description: 'Interactive games, photo booths, team building & more for corporate events in Hyderabad.',
    url: `${siteUrl}/services`,
  },
};

// Category accent colours — matched to service type
const SERVICE_ACCENTS: Record<string, { bg: string; text: string; border: string }> = {
  'photobooth-rentals':                  { bg: 'bg-violet-500/15',  text: 'text-violet-200',  border: 'border-violet-400/30' },
  'photo-booth-rental-services':         { bg: 'bg-violet-500/15',  text: 'text-violet-200',  border: 'border-violet-400/30' },
  'interactive-games-rental-hyderabad':  { bg: 'bg-blue-500/15',    text: 'text-blue-200',    border: 'border-blue-400/30'   },
  'interactive-event-solutions':         { bg: 'bg-blue-500/15',    text: 'text-blue-200',    border: 'border-blue-400/30'   },
  'brand-activation-activities':         { bg: 'bg-orange-500/10',  text: 'text-orange-300',  border: 'border-orange-400/30' },
  'product-launch-engagement-activities':{ bg: 'bg-orange-500/10',  text: 'text-orange-300',  border: 'border-orange-400/30' },
  'corporate-events':                    { bg: 'bg-indigo-500/15',  text: 'text-indigo-200',  border: 'border-indigo-400/30' },
  'corporate-entertainment-solutions':   { bg: 'bg-indigo-500/15',  text: 'text-indigo-200',  border: 'border-indigo-400/30' },
  'team-building-activities':            { bg: 'bg-green-500/15',   text: 'text-green-200',   border: 'border-green-400/30'  },
  'employee-engagement-activities':      { bg: 'bg-green-500/15',   text: 'text-green-200',   border: 'border-green-400/30'  },
  'conference-engagement-activities':    { bg: 'bg-cyan-500/15',    text: 'text-cyan-200',    border: 'border-cyan-400/30'   },
  'exhibition-engagement-activities':    { bg: 'bg-cyan-500/15',    text: 'text-cyan-200',    border: 'border-cyan-400/30'   },
  'event-technology-solutions':          { bg: 'bg-pink-500/15',    text: 'text-pink-200',    border: 'border-pink-400/30'   },
};

const DEFAULT_ACCENT = { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-400/30' };

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <div className="min-h-screen">

      <ZoneHero
        crumbs={
          <nav className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">Services</span>
          </nav>
        }
        chip={`Zone 02 · Games Floor · ${services.length} Services`}
        title="Event Services in Hyderabad"
        description="Interactive games, photo booths, VR simulators, team building and brand activation experiences for corporate events, weddings, college fests and more — across India."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="tel:+919063679687"
            data-magnetic="1"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.8)] transition hover:bg-orange-600"
          >
            <Phone className="h-4 w-4" /> Call Us Now
          </Link>
          <a
            href="https://wa.me/917993912762"
            target="_blank"
            rel="noopener noreferrer"
            data-magnetic="1"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F7A40] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#0b6634]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Us
          </a>
        </div>
      </ZoneHero>
n      {/* ── Services grid ── */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎪</p>
            <h2 className="text-2xl font-semibold text-white mb-2">Services coming soon</h2>
            <p className="text-white/55">Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const accent = SERVICE_ACCENTS[service.slug] || DEFAULT_ACCENT;
              return (
                <TiltCard key={service.id} max={9} className="h-full rounded-2xl"><Link
                  href={`/services/${service.slug}`}
                  className="group h-full bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-400/50 transition-all duration-300 flex flex-col"
                >
                  {/* ── Image: object-contain so nothing is ever cropped ── */}
                  <div className="bg-charcoal-950 flex items-center justify-center overflow-hidden"
                    style={{ minHeight: '220px' }}>
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-auto max-h-[280px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      /* Placeholder when no image */
                      <div className="w-full h-56 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                          <span className="text-3xl">🎪</span>
                        </div>
                        <p className="text-white/55 text-sm font-medium">{service.title}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Card body ──────────────────────────────────────── */}
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {/* Category tag */}
                    <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${accent.bg} ${accent.text} ${accent.border}`}>
                      {service.category || 'Event Service'}
                    </span>

                    <h2 className="text-lg font-bold text-white leading-snug group-hover:text-orange-400 transition">
                      {service.title}
                    </h2>

                    {service.summary && (
                      <p className="text-sm text-white/55 leading-relaxed line-clamp-3 flex-1">
                        {service.summary}
                      </p>
                    )}

                    {/* CTA row */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                      <span className="text-xs text-white/65 font-medium">
                        Hyderabad · Pan India
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-orange-400 group-hover:gap-2 transition-all">
                        View Details <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link></TiltCard>
              );
            })}
          </div>
        )}

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <div className="mt-16 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur rounded-3xl p-10 text-center">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
            Need something specific?
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Let's plan your event together
          </h3>
          <p className="text-white/65 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
            Can't find what you're looking for? We create custom event packages combining multiple services. Talk to us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm shadow-lg shadow-orange-900/30"
            >
              Get a Free Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://wa.me/917993912762"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0F7A40] hover:bg-[#0b6634] text-white font-bold py-3.5 px-8 rounded-xl transition text-sm"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
