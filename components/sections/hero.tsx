'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle, Phone, Star, MapPin } from 'lucide-react';

type HomepageSettings = {
  hero_title?: string;
  hero_subtitle?: string;
  hero_button_text?: string;
  hero_button_link?: string;
  hero_secondary_button_text?: string;
  hero_secondary_button_link?: string;
  hero_background_image?: string | null;
  stat_events_value?: string;
  stat_events_label?: string;
  stat_clients_value?: string;
  stat_clients_label?: string;
  stat_team_value?: string;
  stat_team_label?: string;
};

export function Hero({ settings }: { settings: HomepageSettings | null }) {
  const s = settings || {};

  const categories = [
    { emoji: '🎰', label: '65+ Products' },
    { emoji: '📸', label: 'Photo Booths' },
    { emoji: '🥽', label: 'VR Games' },
    { emoji: '🤖', label: 'AI Experiences' },
    { emoji: '🎯', label: 'Arcade Games' },
    { emoji: '🤝', label: 'Team Building' },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#07091a] pt-16">

      {/* ── Ambient glow blobs ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #6741d9 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* Background image overlay if set */}
      {s.hero_background_image && (
        <div className="absolute inset-0"
          style={{ backgroundImage: `url(${s.hero_background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-[#07091a]/80" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        {/* ── Top badge ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/70">
            <MapPin className="h-3.5 w-3.5 text-orange-400" />
            <span>Hyderabad · Pan India Delivery</span>
            <span className="mx-2 text-white/30">|</span>
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            <span>Premium Event Entertainment</span>
          </div>
        </div>

        {/* ── Main headline ─────────────────────────────────────────────── */}
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            {s.hero_title?.split('\n')[0] || 'Make Your Event'}{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}>
                {s.hero_title?.split('\n')[1] || 'Unforgettable'}
              </span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            {s.hero_subtitle || 'Photo booths, interactive games, VR simulators & team building for corporate events, weddings, college fests and brand activations across India.'}
          </p>

          {/* ── CTAs ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href={s.hero_button_link || '/events'}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-orange-900/40 text-base hover:gap-3"
            >
              {s.hero_button_text || 'Browse All Products'} <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://wa.me/917993912762"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 px-8 rounded-2xl transition-all text-base"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
            <Link
              href="tel:+919063679687"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-4 px-8 rounded-2xl transition-all text-base"
            >
              <Phone className="h-4 w-4 text-orange-400" /> +91 90636 79687
            </Link>
          </div>

          {/* ── Category pills ────────────────────────────────────────────── */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {categories.map(({ emoji, label }) => (
              <span key={label}
                className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-white/10 text-white/70 hover:text-white text-sm px-4 py-2 rounded-full transition-all cursor-default">
                <span>{emoji}</span> {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: s.stat_events_value || '500+', label: s.stat_events_label || 'Events Delivered' },
            { value: s.stat_clients_value || '65+',  label: s.stat_clients_label || 'Products Available' },
            { value: s.stat_team_value   || '50K+',  label: s.stat_team_label   || 'Guests Entertained' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center bg-white/5 border border-white/8 rounded-2xl py-5 px-3">
              <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-xs text-white/50 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white" />
        <p className="text-white text-xs tracking-widest uppercase">Scroll</p>
      </div>
    </section>
  );
}
