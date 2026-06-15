'use client';

import Link from 'next/link';
import { ArrowRight, Phone, MessageCircle, MapPin } from 'lucide-react';

export function CallToAction() {
  const eventTypes = [
    'Corporate Annual Days', 'Weddings & Sangeet', 'College Fests',
    'Brand Activations', 'Product Launches', 'Exhibition Booths',
    'Team Building', 'Family Days',
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Why us strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            { icon: '⚡', title: 'Same-Day Quotes', desc: 'We respond within hours' },
            { icon: '🛠️', title: 'Full Setup Included', desc: 'Delivery, install & dismantle' },
            { icon: '🗺️', title: 'Pan India', desc: 'Hyderabad & 20+ cities' },
            { icon: '🎯', title: '65+ Products', desc: 'Largest catalogue in India' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* Main CTA card */}
        <div className="bg-[#07091a] rounded-3xl p-8 md:p-14 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">Get a Free Quote</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Planning an Event?<br />
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}>
                  Let's Make It Epic.
                </span>
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-md">
                Tell us about your event and we'll put together a custom entertainment package — photo booths, games, VR, and more.
              </p>

              {/* Event type pills */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {eventTypes.map((type) => (
                  <span key={type} className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: contact options */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <Link href="/contact"
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition shadow-lg shadow-orange-900/30 text-sm">
                Get a Free Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="https://wa.me/917993912762"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 px-6 rounded-2xl transition text-sm">
                <MessageCircle className="h-4 w-4" /> WhatsApp Us — Fastest Response
              </a>
              <a href="tel:+919063679687"
                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-4 px-6 rounded-2xl transition text-sm">
                <Phone className="h-4 w-4 text-orange-400" /> +91 90636 79687
              </a>
              <div className="flex items-center justify-center gap-1.5 text-white/30 text-xs mt-1">
                <MapPin className="h-3 w-3" />
                Madhapur, Hyderabad · Pan India Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
