import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, MessageCircle, MapPin, ArrowRight, ChevronRight, CheckCircle2, Star, Zap, Shield, Heart, Globe } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Retreat Arcade | Hyderabad\'s Premier Event Entertainment Company',
  description: 'Retreat Arcade is Hyderabad\'s leading interactive event entertainment company — 65+ products including photo booths, VR simulators, arcade games and team building activities. Serving 500+ events across India since 2019.',
  // ✅ FIX: was missing its own keywords entirely, silently inheriting
  // the generic sitewide list from the root layout instead of terms
  // specific to a company/about page.
  keywords: [
    'about Retreat Arcade', 'event entertainment company Hyderabad',
    'photo booth company Hyderabad', 'event rental company India',
    'Retreat Arcade reviews', 'event entertainment provider Hyderabad',
  ],
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: 'About Retreat Arcade — Hyderabad\'s Premier Event Entertainment Company',
    description: '65+ interactive event products including photo booths, VR simulators, arcade games and team building activities for corporate events, weddings and college fests across India.',
    url: `${siteUrl}/about`,
    images: [{ url: `${siteUrl}/logo.png`, width: 1024, height: 1024 }],
  },
};

// ── Schema ──────────────────────────────────────────────────────────────────
const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Retreat Arcade",
  url: `${siteUrl}/about`,
  description: "Retreat Arcade is Hyderabad's leading interactive event entertainment company providing photo booths, VR simulators, interactive games and team building activities for corporate events, weddings and college fests across India.",
  mainEntity: {
    "@type": "LocalBusiness",
    name: "Retreat Arcade",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    foundingDate: "2019",
    description: "Premium event entertainment company based in Madhapur, Hyderabad providing 65+ interactive products including photo booths, VR simulators, arcade games, AI experiences and team building activities.",
    numberOfEmployees: { "@type": "QuantitativeValue", value: 20 },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ayyappa Society, Madhapur",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500084",
      addressCountry: "IN",
    },
    telephone: "+91-9063679687",
    areaServed: { "@type": "Country", name: "India" },
    knowsAbout: [
      "Photo Booth Rental", "360 Degree Photo Booth", "AI Photo Booth",
      "VR Simulator Rental", "Interactive Game Rental", "Team Building Activities",
      "Brand Activation", "Corporate Event Entertainment", "College Fest Activities",
    ],
    openingHoursSpecification: [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens: "09:00", closes: "21:00",
    }],
  },
};

export default function AboutPage() {
  const stats = [
    { value: "500+",  label: "Events Delivered",     sub: "Since 2019" },
    { value: "65+",   label: "Products Available",    sub: "Largest in Hyderabad" },
    { value: "50K+",  label: "Guests Entertained",    sub: "Across India" },
    { value: "20+",   label: "Cities Served",         sub: "And growing" },
  ];

  const products = [
    { cat: "Photo Booths", items: "360°, AI, Magic Mirror, AR, GIF, Slow-Mo, Green Screen & 15 more" },
    { cat: "VR Simulators", items: "Roller Coaster, Bike Racing, Boxing, Cricket, Car Racing, Dance & more" },
    { cat: "Arcade Games", items: "Air Hockey, Basketball, Claw Machine, Whack-a-Mole, Hammer Strike & more" },
    { cat: "Interactive Games", items: "Giant Jenga, Foosball, Archery, Carrom, Ring Toss, Mini Golf & more" },
    { cat: "Team Building", items: "Escape Room, Treasure Hunt, Human Foosball, Tug of War, Relay Race & more" },
    { cat: "Digital Games", items: "Interactive Floor Projection, AR Game Zone, Social Wall & more" },
  ];

  const values = [
    { icon: Zap,      title: "High Energy",      desc: "Every product we offer is designed to create genuine excitement — not passive entertainment. Guests participate, compete and celebrate." },
    { icon: Shield,   title: "Reliability",       desc: "We arrive on time, set up professionally and operate throughout your event. 500+ events delivered — zero no-shows." },
    { icon: Heart,    title: "Guest First",       desc: "We design experiences around your guests — their age groups, preferences and comfort — not just what looks impressive in a brochure." },
    { icon: Star,     title: "Premium Quality",   desc: "Every product is maintained to professional standards. No outdated equipment, no last-minute substitutions." },
    { icon: Globe,    title: "Pan India Reach",   desc: "Based in Hyderabad, we deliver across 20+ cities including Bangalore, Chennai, Mumbai, Pune and Delhi." },
    { icon: CheckCircle2, title: "Transparent Pricing", desc: "We quote exactly what you pay. No hidden charges, no surprise add-ons on event day." },
  ];

  const eventTypes = [
    { type: "Corporate Annual Days",    desc: "Photo booths, VR zones and interactive games that keep 200–2000 employees genuinely engaged" },
    { type: "Brand Activations",        desc: "Lead generation, hashtag printing and experiential setups for malls, exhibitions and roadshows" },
    { type: "College Fests",            desc: "High-energy arcade games, AI booths and VR simulators that college audiences actually queue for" },
    { type: "Wedding & Sangeet",        desc: "360° booths, flower walls, neon signs and magic mirrors that become the highlight of every celebration" },
    { type: "Conferences & Summits",    desc: "AI headshot booths, social walls and quiz buzzers that keep delegates active between sessions" },
    { type: "Team Building Events",     desc: "Escape rooms, treasure hunts and human foosball that create genuine collaboration under pressure" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-24 pb-16 relative overflow-hidden">
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-8">
              <Link href="/" className="hover:text-white/80 transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70">About Us</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full mb-4">
                  Based in Hyderabad · Since 2019
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                  Hyderabad's Premier<br />
                  <span className="text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}>
                    Event Entertainment
                  </span><br />
                  Company
                </h1>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Retreat Arcade is the largest interactive event entertainment provider in Hyderabad — with 65+ products including photo booths, VR simulators, arcade games, AI experiences and team building activities. We've entertained 50,000+ guests across 500+ events since 2019.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-6 rounded-xl transition text-sm shadow-lg shadow-orange-900/30">
                    Get a Free Quote <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="https://wa.me/917993912762" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 px-6 rounded-xl transition text-sm">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Us
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map(({ value, label, sub }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-orange-500/30 transition-colors">
                    <p className="text-4xl font-extrabold text-white mb-1">{value}</p>
                    <p className="text-sm font-semibold text-white/80">{label}</p>
                    <p className="text-xs text-white/40 mt-1">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

          {/* ── Who We Are ───────────────────────────────────────────────── */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Who We Are</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                  We Make Events Unforgettable
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>Retreat Arcade was founded in 2019 with a single conviction — that event entertainment in India deserved to be better. More immersive. More interactive. More memorable than a stage and a DJ. We started with a handful of photo booths and a commitment to professional, punctual, high-quality service.</p>
                  <p>Today we are Hyderabad's most comprehensive event entertainment company — with <strong className="text-gray-900">65+ products</strong> across photo booths, VR simulators, arcade games, AI experiences, digital games and team building activities. We have delivered <strong className="text-gray-900">500+ events</strong> for India's leading corporations, universities, wedding planners and brand agencies.</p>
                  <p>We operate from Madhapur, Hyderabad and serve 20+ cities across India including Bangalore, Chennai, Mumbai, Pune and Delhi. Every event comes with professional delivery, expert setup, trained on-site operators and full dismantling — so you focus on your event while we handle the entertainment.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4">What Makes Us Different</p>
                  <ul className="space-y-3">
                    {[
                      "65+ products — the largest event entertainment catalogue in Hyderabad",
                      "Same-day quotes — we respond within hours, not days",
                      "Professional operators at every event — not just equipment drop-off",
                      "Transparent pricing — what we quote is what you pay",
                      "Pan India delivery — Hyderabad base, 20+ cities served",
                      "Zero no-shows in 500+ events since 2019",
                    ].map(item => (
                      <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#07091a] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    <p className="text-sm font-semibold text-white">Hyderabad Headquarters</p>
                  </div>
                  <p className="text-sm text-white/60 mb-4">Ayyappa Society, Madhapur, Hyderabad, Telangana 500084</p>
                  <a href="tel:+919063679687" className="text-lg font-bold text-orange-400 hover:text-orange-300 transition block">
                    +91 9063679687
                  </a>
                  <p className="text-xs text-white/40 mt-1">Mon–Sun · 9am–9pm</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Products ──────────────────────────────────────────────────── */}
          <section>
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Our Products</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">65+ Event Entertainment Products</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">The largest interactive event entertainment catalogue in Hyderabad — from ₹3,500 photo booth rentals to ₹65,000 VR experience zones.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(({ cat, items }) => (
                <div key={cat} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all">
                  <span className="inline-block text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full mb-3">{cat}</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{items}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/events"
                className="inline-flex items-center gap-2 bg-[#07091a] hover:bg-gray-900 text-white font-bold py-3.5 px-8 rounded-xl transition text-sm">
                Browse All 65+ Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* ── Event types ───────────────────────────────────────────────── */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Events We Serve</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Entertainment for Every Event Type</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {eventTypes.map(({ type, desc }) => (
                <div key={type} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
                  <h3 className="font-bold text-gray-900 mb-2">{type}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Values ────────────────────────────────────────────────────── */}
          <section>
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Our Values</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What We Stand For</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {values.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-orange-200 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <section className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">Ready to Work Together?</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Let's Make Your Event Epic
              </h2>
              <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto leading-relaxed">
                Tell us about your event — date, venue, expected guests, and what kind of entertainment you're looking for. We'll send you a custom quote within a few hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition shadow-lg shadow-orange-900/30 text-sm">
                  Get a Free Quote <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="https://wa.me/917993912762" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 px-8 rounded-xl transition text-sm">
                  <MessageCircle className="h-4 w-4" /> WhatsApp — Fastest Response
                </a>
                <a href="tel:+919063679687"
                  className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-xl transition text-sm">
                  <Phone className="h-4 w-4 text-orange-400" /> +91 9063679687
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
