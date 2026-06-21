import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ContactClient } from './contact-client';
import { getSiteSettings } from '@/lib/settings';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Retreat Arcade | Get a Free Quote for Photo Booths, VR & Games in Hyderabad',
  description: 'Contact Retreat Arcade to book photo booths, VR simulators, arcade games and team building activities for your event in Hyderabad. Call, WhatsApp or request a free quote — we respond within hours.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: 'Contact Retreat Arcade — Get a Free Quote',
    description: 'Book photo booths, VR simulators and interactive games for your event in Hyderabad. We respond within hours.',
    url: `${siteUrl}/contact`,
    images: [{ url: `${siteUrl}/logo.png`, width: 1024, height: 1024 }],
  },
};

// ✅ ContactPage + LocalBusiness schema with opening hours
const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Retreat Arcade",
  url: `${siteUrl}/contact`,
  description: "Contact Retreat Arcade for interactive game rentals, photo booths, VR simulators and event entertainment across India.",
  mainEntity: {
    "@type": "LocalBusiness",
    name: "Retreat Arcade",
    telephone: "+91-9063679687",
    email: "info@retreatarcade.in",
    url: siteUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ayyappa Society, Madhapur",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500084",
      addressCountry: "IN",
    },
    openingHoursSpecification: [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens: "09:00",
      closes: "21:00",
    }],
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const contactInfo = {
    email: settings.contact_email || 'info@retreatarcade.in',
    phone: settings.contact_phone || '+91 9063679687',
    address: settings.address || 'Ayyappa Society, Madhapur, Hyderabad, Telangana 500084',
  };

  const faqs = [
    {
      q: "How quickly will I get a quote?",
      a: "We respond to most enquiries within a few hours during business hours, and always within 24 hours.",
    },
    {
      q: "Do you deliver outside Hyderabad?",
      a: "Yes. We deliver across 20+ cities including Bangalore, Chennai, Mumbai, Pune and Delhi NCR. Transportation charges may apply outside Hyderabad.",
    },
    {
      q: "Is setup and operator included in the price?",
      a: "Yes. Every rental includes delivery, professional setup, a trained on-site operator for the event duration, and dismantling — no hidden charges.",
    },
    {
      q: "Can I book multiple products together?",
      a: "Yes. Most clients combine 2-3 products — for example a photo booth with an arcade game. Tell us your event type and we'll suggest the right combination.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Dark hero header — matches about/blog/events pages ──────────── */}
        <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-24 pb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white/80 transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70">Contact</span>
            </nav>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full mb-4">
              We Respond Within Hours
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Let's Plan Your Event
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Tell us your event date, venue and what you have in mind — photo booths, VR, arcade games or team building. We'll send a custom quote within hours.
            </p>
          </div>
        </div>

        {/* ── Form + sidebar ─────────────────────────────────────────────── */}
        <ContactClient contactInfo={contactInfo} />

        {/* ── FAQ — SEO content + reduces repetitive enquiries ─────────── */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{f.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          {/* Internal links to product/service pages — SEO + conversion */}
          <div className="mt-10 bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Not sure what to ask for?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/events" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                Browse All Products →
              </Link>
              <Link href="/services" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                Explore Our Services →
              </Link>
              <Link href="/blog" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                Read Event Planning Guides →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
