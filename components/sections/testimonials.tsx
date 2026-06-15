'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Quote } from 'lucide-react';

type Testimonial = {
  id: string;
  client_name: string;
  client_title?: string;
  content: string;
  rating?: number;
  is_featured?: boolean;
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('testimonials')
        .select('id, client_name, client_title, content, rating, is_featured')
        .limit(6);
      if (!data || data.length === 0) return;
      const featured = data.filter((t: any) => t.is_featured === true);
      setTestimonials(featured.length > 0 ? featured : data);
    }
    load();
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-[#07091a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">Social Proof</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">What Our Clients Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-orange-500/30 transition-colors"
            >
              {/* Stars */}
              <div className="flex items-center gap-1">
                {[...Array(t.rating || 5)].map((_, s) => (
                  <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative flex-1">
                <Quote className="h-5 w-5 text-orange-400/40 absolute -top-1 -left-1" />
                <p className="text-white/70 text-sm leading-relaxed pl-4 italic">
                  "{t.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                  {t.client_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.client_name}</p>
                  {t.client_title && (
                    <p className="text-white/40 text-xs">{t.client_title}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
