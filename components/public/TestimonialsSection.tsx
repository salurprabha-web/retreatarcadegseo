import React, { useState, useEffect } from 'react';
import { Testimonial } from '../../types';
import { createClient } from '@/lib/supabase/client';

// Fix: Instantiate Supabase client
const supabase = createClient();

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg
                key={i}
                className={`w-5 h-5 ${i < rating ? 'text-brand-accent' : 'text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);


const TestimonialsSection: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .order('date', { ascending: false })
                .limit(3);
            if (error) {
                console.error("Error fetching testimonials:", error);
            } else {
                setTestimonials(data);
            }
        };
        fetchTestimonials();
    }, []);

  return (
    <section id="testimonials" className="py-20 bg-brand-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white font-poppins">What Our Clients Say</h2>
          <p className="text-lg text-gray-400 mt-2">Trusted by top event planners and brands.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-brand-dark p-8 rounded-lg shadow-lg flex flex-col">
              <StarRating rating={testimonial.rating} />
              <p className="text-lg text-gray-300 italic my-4 flex-grow">
                "{testimonial.highlighted_quote || testimonial.testimonial_text}"
              </p>
              <div>
                <p className="font-bold text-white">{testimonial.client_name}</p>
                <p className="text-sm text-brand-accent">{testimonial.event_type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;