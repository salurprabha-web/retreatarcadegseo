import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { getPublishedEvents } from '@/lib/events';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Explore our rental products and interactive experiences',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div
        className="relative h-72 flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-3">
            Our Products
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Explore interactive event rentals & experiential setups for any occasion
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {events.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Products Available
            </h2>
            <p className="text-gray-600">
              Check back soon for new product additions!
            </p>
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">

                {/* IMAGE */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <CardHeader>
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {event.summary}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* PRICE ONLY */}
                  <div className="flex items-center text-sm text-gray-700 font-semibold">
                    <span className="mr-1 text-orange-600 text-lg">₹</span>
                    {event.price ? Number(event.price).toLocaleString('en-IN') : 'Price TBA'}
                  </div>
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
            ))}
          </div>

        )}
      </div>
    </div>
  );
}
