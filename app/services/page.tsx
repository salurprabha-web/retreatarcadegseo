import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone, MessageCircle, ChevronRight } from 'lucide-react';
import { getPublishedServices } from '@/lib/services';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

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
  'photobooth-rentals':                  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  'photo-booth-rental-services':         { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  'interactive-games-rental-hyderabad':  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  'interactive-event-solutions':         { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  'brand-activation-activities':         { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'product-launch-engagement-activities':{ bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  'corporate-events':                    { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'corporate-entertainment-solutions':   { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  'team-building-activities':            { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  'employee-engagement-activities':      { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200'  },
  'conference-engagement-activities':    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200'   },
  'exhibition-engagement-activities':    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200'   },
  'event-technology-solutions':          { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200'   },
};

const DEFAULT_ACCENT = { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1.5 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white/80 transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70">Services</span>
          </nav>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full mb-4">
            {services.length} Services Available
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Event Services in Hyderabad
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Interactive games, photo booths, VR simulators, team building and brand activation experiences for corporate events, weddings, college fests and more — across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="tel:+919063679687"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition text-sm shadow-lg shadow-orange-900/30"
            >
              <Phone className="h-4 w-4" /> Call Us Now
            </Link>
            <a
              href="https://wa.me/917993912762"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-6 rounded-xl transition text-sm"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* ── Services grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        {services.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎪</p>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Services coming soon</h2>
            <p className="text-gray-500">Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const accent = SERVICE_ACCENTS[service.slug] || DEFAULT_ACCENT;
              return (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col"
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
                        <p className="text-white/40 text-sm font-medium">{service.title}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Card body ──────────────────────────────────────── */}
                  <div className="flex flex-col flex-1 p-5 gap-3">
                    {/* Category tag */}
                    <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${accent.bg} ${accent.text} ${accent.border}`}>
                      {service.category || 'Event Service'}
                    </span>

                    <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-orange-600 transition">
                      {service.title}
                    </h2>

                    {service.summary && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                        {service.summary}
                      </p>
                    )}

                    {/* CTA row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                      <span className="text-xs text-gray-400 font-medium">
                        Hyderabad · Pan India
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-orange-500 group-hover:gap-2 transition-all">
                        View Details <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <div className="mt-16 bg-gradient-to-br from-charcoal-900 to-charcoal-950 rounded-3xl p-10 text-center">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
            Need something specific?
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Let's plan your event together
          </h3>
          <p className="text-gray-400 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
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
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 px-8 rounded-xl transition text-sm"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
