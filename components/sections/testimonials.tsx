import { supabase } from '@/lib/supabase';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

async function getTestimonials() {
  const { data } = await supabase
    .from('testimonials')
    .select('id, client_name, client_title, content, rating, is_featured')
    .eq('is_featured', true)
    .order('display_order', { ascending: true })
    .limit(6);
  return data || [];
}

export async function Testimonials() {
  const testimonials = await getTestimonials();
  if (!testimonials.length) return null;

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from those who trusted us to make their events unforgettable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <Card key={t.id} className="h-full bg-white hover:shadow-xl transition-shadow duration-300 relative">
              <Quote className="absolute top-4 right-4 h-12 w-12 text-orange-100" />
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-200 flex-shrink-0">
                    <span className="text-orange-600 font-bold text-xl">
                      {t.client_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900">{t.client_name}</h4>
                    {t.client_title && <p className="text-sm text-gray-600">{t.client_title}</p>}
                  </div>
                </div>
                {t.rating && (
                  <div className="flex mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                )}
                <p className="text-gray-700 leading-relaxed italic">"{t.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
