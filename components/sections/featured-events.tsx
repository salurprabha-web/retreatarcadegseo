'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ✅ Updated interface — removed deleted fields
interface Event {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  price: number | null;
  image_url: string | null;
  category: string;
}

export function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();
  }, []);

  async function fetchFeaturedEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, summary, price, image_url, category')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false }) // ✅ Updated
        .limit(3);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching featured events:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || events.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Events
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our top-rated experiences designed to elevate your celebrations.
          </p>
        </motion.div>

        {/* Featured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition duration-300 rounded-xl">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      event.image_url ||
                      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'
                    }
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />

                  <Badge className="absolute top-4 right-4 bg-orange-600 hover:bg-orange-700">
                    {event.category}
                  </Badge>
                </div>

                <CardHeader>
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                  {event.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {event.summary}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {event.price && (
                    <div className="pt-2">
                      <span className="text-2xl font-bold text-orange-600">
                        ₹{event.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">onwards</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  >
                    <Link href={`/events/${event.slug}`}>
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View all events button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            asChild
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Link href="/events">
              View All Events <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
