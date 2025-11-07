'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type HomepageSettings = {
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  hero_secondary_button_text: string;
  hero_secondary_button_link: string;
  hero_background_image: string | null;
  stat_events_value: string;
  stat_events_label: string;
  stat_clients_value: string;
  stat_clients_label: string;
  stat_team_value: string;
  stat_team_label: string;
};

export function Hero() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from('homepage_settings')
        .select('*')
        .maybeSingle();

      if (data) {
        setSettings(data);
      }
    }
    loadSettings();
  }, []);

  const heroTitle = settings?.hero_title || 'Create Unforgettable\nCelebrations';
  const heroSubtitle = settings?.hero_subtitle || 'Expert event management and cultural celebrations that bring your vision to life';
  const heroBtnText = settings?.hero_button_text || 'Explore Events';
  const heroBtnLink = settings?.hero_button_link || '/events';
  const heroSecBtnText = settings?.hero_secondary_button_text || 'Contact Us';
  const heroSecBtnLink = settings?.hero_secondary_button_link || '/contact';
  const statEventsValue = settings?.stat_events_value || '100+ Events';
  const statEventsLabel = settings?.stat_events_label || 'Successfully organized';
  const statClientsValue = settings?.stat_clients_value || '5000+ Guests';
  const statClientsLabel = settings?.stat_clients_label || 'Satisfied customers';
  const statTeamValue = settings?.stat_team_value || 'Expert Team';
  const statTeamLabel = settings?.stat_team_label || 'Professional planners';
  const heroBackgroundImage = settings?.hero_background_image;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-20">
      {heroBackgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBackgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        </>
      )}
      {!heroBackgroundImage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-terracotta-900/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gold-900/10 via-transparent to-transparent"></div>
        </>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block mb-4">
            <span className="inline-block px-4 py-2 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 text-terracotta-300 text-sm font-medium">
              Premium Event Management
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-cream-50 mb-6 leading-tight whitespace-pre-line tracking-tight">
            {heroTitle.split('\n').map((line, i) => (
              <span key={i} className={i === 1 ? 'text-terracotta-400' : ''}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-xl md:text-2xl text-cream-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white text-lg px-10 py-7 rounded-full shadow-xl shadow-terracotta-900/50 hover:shadow-2xl hover:shadow-terracotta-900/70 transition-all duration-300 border border-terracotta-400/20"
            >
              <Link href={heroBtnLink}>
                {heroBtnText} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-terracotta-400/50 bg-charcoal-900/50 backdrop-blur-sm text-cream-100 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 text-lg px-10 py-7 rounded-full transition-all duration-300"
            >
              <Link href={heroSecBtnLink}>{heroSecBtnText}</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="group bg-gradient-to-br from-charcoal-800/80 to-charcoal-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-terracotta-500/20 hover:border-terracotta-500/40 transition-all duration-300 hover:scale-105">
            <div className="bg-terracotta-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-terracotta-500/20 transition-colors">
              <Calendar className="h-8 w-8 text-terracotta-400" />
            </div>
            <h3 className="text-cream-50 text-3xl font-bold mb-2">
              {statEventsValue}
            </h3>
            <p className="text-cream-300 text-sm">{statEventsLabel}</p>
          </div>
          <div className="group bg-gradient-to-br from-charcoal-800/80 to-charcoal-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 hover:scale-105">
            <div className="bg-gold-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/20 transition-colors">
              <Users className="h-8 w-8 text-gold-400" />
            </div>
            <h3 className="text-cream-50 text-3xl font-bold mb-2">
              {statClientsValue}
            </h3>
            <p className="text-cream-300 text-sm">{statClientsLabel}</p>
          </div>
          <div className="group bg-gradient-to-br from-charcoal-800/80 to-charcoal-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-cream-500/20 hover:border-cream-500/40 transition-all duration-300 hover:scale-105">
            <div className="bg-cream-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cream-500/20 transition-colors">
              <Sparkles className="h-8 w-8 text-cream-400" />
            </div>
            <h3 className="text-cream-50 text-3xl font-bold mb-2">
              {statTeamValue}
            </h3>
            <p className="text-cream-300 text-sm">{statTeamLabel}</p>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-terracotta-400 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-terracotta-400 rounded-full" />
        </div>
      </div>
    </section>
  );
}
