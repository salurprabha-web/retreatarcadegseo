'use client';

import Link from 'next/link';
import { ArrowRight, Box, MessageCircle, Phone, Star, MapPin } from 'lucide-react';
import { TiltCard } from '@/components/three/tilt-card';
import { CountUp } from '@/components/three/count-up';
import { ZoneChip } from '@/components/world/zone';

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

  const stats = [
    { value: s.stat_events_value || '500+', label: s.stat_events_label || 'Events Delivered' },
    { value: s.stat_clients_value || '65+', label: s.stat_clients_label || 'Products Available' },
    { value: s.stat_team_value || '50K+', label: s.stat_team_label || 'Guests Entertained' },
  ];

  return (
    <section className="relative isolate flex min-h-screen items-center px-4 pb-20 pt-32 sm:px-6 lg:px-12">
      {/* CMS-provided hero image is kept, as a faint texture under the 3D world */}
      {s.hero_background_image && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-20"
          style={{ backgroundImage: `url(${s.hero_background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl xl:ml-24">
          <ZoneChip className="mb-6">
            <MapPin className="h-3 w-3" /> Hyderabad · Pan India Delivery
            <span className="text-white/30">|</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> Premium Event Entertainment
          </ZoneChip>

          <h1
            className={`text-shadow-soft mb-6 font-bold leading-[1.04] text-white ${
              (s.hero_title || '').length > 42
                ? 'text-4xl sm:text-5xl lg:text-6xl'
                : 'text-5xl sm:text-6xl lg:text-[5.5rem]'
            }`}
          >
            {s.hero_title?.split('\n')[0] || 'Make Your Event'}{' '}
            <span className="neon-text">{s.hero_title?.split('\n')[1] || 'Unforgettable'}</span>
          </h1>

          <p className="text-shadow-soft mb-9 max-w-xl text-lg font-light leading-relaxed text-white/90 md:text-xl">
            {s.hero_subtitle ||
              'Photo booths, interactive games, VR simulators & team building for corporate events, weddings, college fests and brand activations across India.'}
          </p>

          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={s.hero_button_link || '/events'}
              data-magnetic="1"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-[0_10px_50px_-8px_rgba(194,65,12,0.9)] transition-colors hover:bg-orange-600"
            >
              {s.hero_button_text || 'Browse All Products'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/plan-your-event"
              data-magnetic="1"
              className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold text-orange-200 transition-colors hover:text-white"
            >
              <Box className="h-4 w-4" /> Plan Your Event in 3D
            </Link>
            <a
              href="https://wa.me/917993912762"
              target="_blank"
              rel="noopener noreferrer"
              data-magnetic="1"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#128C4A] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#0f7a40]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
            <Link
              href="tel:+919063679687"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-4 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-orange-400" /> +91 90636 79687
            </Link>
          </div>

          <div className="mb-10 flex flex-wrap gap-2">
            {categories.map(({ emoji, label }) => (
              <span
                key={label}
                className="glass inline-flex cursor-default items-center gap-1.5 rounded-full px-4 py-2 text-sm text-white/85 transition-all hover:-translate-y-0.5 hover:text-white"
              >
                <span>{emoji}</span> {label}
              </span>
            ))}
          </div>

          <div className="grid max-w-xl grid-cols-3 gap-3">
            {stats.map(({ value, label }) => (
              <TiltCard key={label} max={14} className="glass rounded-2xl px-3 py-5 text-center">
                <p className="font-display mb-1 text-3xl font-bold text-white [transform:translateZ(30px)]">
                  <CountUp value={value} />
                </p>
                <p className="text-xs font-medium text-white/70 [transform:translateZ(14px)]">{label}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 lg:flex">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll · walk through the arcade</span>
        <span className="relative h-10 w-6 rounded-full border border-white/40">
          <span className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 animate-bounce rounded-full bg-orange-400" />
        </span>
      </div>
    </section>
  );
}
