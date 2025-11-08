import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, ArrowLeft, Phone, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { convertToDirectImageUrl } from '@/lib/image-utils';
import { EventImage, GalleryImage } from '@/components/event-image';

type Props = {
  params: { slug: string };
};

// ✅ Fetch event
async function getEvent(slug: string) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  return data;
}

// ✅ Fetch similar events from same category
async function getSimilarEvents(category: string, currentEventId: string) {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .neq('id', currentEventId)
    .eq('is_published', true);

  return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);

  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      images: [event.image_url],
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);

  if (!event) {
    notFound();
  }

  // ✅ Fetch similar events
  const similarEvents = await getSimilarEvents(event.category, event.id);

  // ✅ Randomize order
  similarEvents.sort(() => Math.random() - 0.5);

  // ✅ Limit to top 3
  const limitedSimilarEvents = similarEvents.slice(0, 3);

  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const galleryImages = event.gallery_images
    ? (Array.isArray(event.gallery_images)
        ? event.gallery_images.map((url: string) => convertToDirectImageUrl(url))
        : [])
    : [];

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* HERO SECTION */}
      <div className="relative h-[60vh] overflow-hidden">
        <EventImage
          src={featuredImageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/events"
              className="inline-flex items-center text-cream-200 mb-4 hover:text-terracotta-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>

            <Badge className="bg-terracotta-500 hover:bg-terracotta-600 mb-4 text-white">
              {event.category || 'Event'}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-cream-50 mb-4">
              {event.title}
            </h1>

            <p className="text-xl text-cream-200 max-w-3xl">
              {event.summary}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SECTION */}
          <div className="lg:col-span-2">

            {/* Event Description */}
            <Card className="mb-8 bg-charcoal-900 border-terracotta-500/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-cream-50 mb-6">
                  Event Details
                </h2>
                <div
                  className="prose prose-invert max-w-none text-cream-300"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </CardContent>
            </Card>

            {/* Highlights */}
            {event.highlights && event.highlights.length > 0 && (
              <Card className="mb-8 bg-charcoal-900 border-terracotta-500/10">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-cream-50 mb-6">
                    Event Highlights
                  </h2>
                  <ul className="space-y-3">
                    {event.highlights.map((highlight: string, index: number) => (
                      <li key={index} className="flex items-start text-cream-300">
                        <div className="w-6 h-6 rounded-full bg-terracotta-500/20 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <Check className="h-4 w-4 text-terracotta-400" />
                        </div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {galleryImages && galleryImages.length > 0 && (
              <Card className="bg-charcoal-900 border-terracotta-500/10 mb-12">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-cream-50 mb-6">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.map((image: string, index: number) => (
                      <div
                        key={index}
                        className="relative h-48 rounded-xl overflow-hidden border border-terracotta-500/20 hover:border-terracotta-500/40 transition-all"
                      >
                        <GalleryImage
                          src={image}
                          alt={`${event.title} gallery ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ SIMILAR EVENTS SECTION */}
            {limitedSimilarEvents.length > 0 && (
              <Card className="bg-charcoal-900 border-terracotta-500/20">
                <CardContent className="pt-8">
                  <h2 className="text-3xl font-bold text-cream-50 mb-8">
                    Similar Events You May Like
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {limitedSimilarEvents.map((item) => (
                      <Link key={item.id} href={`/events/${item.slug}`}>
                        <div className="group bg-charcoal-800 border border-cream-100/10 rounded-2xl overflow-hidden hover:border-terracotta-500/40 transition-all shadow-md hover:shadow-terracotta-500/20">
                          
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/30 to-transparent"></div>
                          </div>

                          <div className="p-4">
                            <Badge className="mb-3 bg-terracotta-600 text-white">
                              {item.category}
                            </Badge>

                            <h3 className="text-lg font-semibold text-cream-50 mb-2 line-clamp-2">
                              {item.title}
                            </h3>

                            <p className="text-sm text-cream-300 line-clamp-2 mb-4">
                              {item.summary}
                            </p>

                            <div className="flex items-center text-cream-300 text-sm mb-1">
                              <Calendar className="h-4 w-4 mr-2 text-terracotta-400" />
                              {item.start_date
                                ? new Date(item.start_date).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : 'Date TBA'}
                            </div>

                            <div className="flex items-center text-cream-300 text-sm mb-1">
                              <MapPin className="h-4 w-4 mr-2 text-gold-400" />
                              {item.location || 'Location TBA'}
                            </div>

                            <div className="flex items-center text-cream-300 text-sm">
                              <span className="text-gold-400 mr-2 font-bold">₹</span>
                              {item.price || 'Price TBA'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-charcoal-900 border-terracotta-500/20">
              <CardContent className="pt-6">
                <div className="space-y-4 mb-6">

                  {event.start_date && (
                    <div className="flex items-center text-cream-300">
                      <div className="w-10 h-10 rounded-lg bg-terracotta-500/10 flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-terracotta-400" />
                      </div>
                      <div>
                        <p className="text-sm text-cream-400">Date</p>
                        <p className="font-semibold text-cream-50">
                          {new Date(event.start_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.price && (
                    <div className="flex items-center text-cream-300">
                      <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center mr-3">
                        <span className="text-gold-400 text-lg font-bold">₹</span>
                      </div>
                      <div>
                        <p className="text-sm text-cream-400">Price</p>
                        <p className="font-semibold text-cream-50">₹{event.price}</p>
                      </div>
                    </div>
                  )}

                  {event.max_participants && (
                    <div className="flex items-center text-cream-300">
                      <div className="w-10 h-10 rounded-lg bg-terracotta-500/10 flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-terracotta-400" />
                      </div>
                      <div>
                        <p className="text-sm text-cream-400">Capacity</p>
                        <p className="font-semibold text-cream-50">
                          Up to {event.max_participants} guests
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    asChild
                    className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full"
                    size="lg"
                  >
                    <Link href="tel:+919063679687">
                      <Phone className="mr-2 h-5 w-5" />
                      Call to Inquire
                    </Link>
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl">
                  <p className="text-sm text-cream-300 text-center">
                    Contact us for pricing and customization options! 9063679687
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
