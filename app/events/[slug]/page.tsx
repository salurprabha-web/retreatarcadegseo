import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, MapPin, Users, ArrowLeft, Phone, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { convertToDirectImageUrl } from '@/lib/image-utils';
import { EventImage, GalleryImage } from '@/components/event-image';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type Props = {
  params: { slug: string };
};

async function getEvent(slug: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) console.error('Event fetch error:', error);
  return data;
}

async function getSimilarEvents(category: string, currentEventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .neq('id', currentEventId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Similar events error:', error);
    return [];
  }

  return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);

  if (!event) return { title: 'Event Not Found' };

  const title = event.meta_title || event.title;
  const description =
    event.meta_description ||
    event.summary ||
    (event.description ? event.description.replace(/<[^>]+>/g, '').slice(0, 160) : '');

  const keywords = event.meta_keywords?.length ? event.meta_keywords.join(',') : '';
  const image = event.image_url || undefined;
  const canonical = event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      url: canonical,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);

  if (!event) notFound();

  const similarEvents = await getSimilarEvents(event.category, event.id);

  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg';

  const galleryImages = Array.isArray(event.gallery_images)
    ? event.gallery_images.map((url: string) => convertToDirectImageUrl(url))
    : [];

  const domain = 'https://www.retreatarcade.in';
  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;

  const schemaFromDb =
    event.schema_json && Object.keys(event.schema_json).length > 0
      ? event.schema_json
      : null;

  const fallbackSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: event.summary || event.description || '',
      startDate: event.start_date || undefined,
      endDate: event.end_date || undefined,
      location: event.location ? { '@type': 'Place', name: event.location } : undefined,
      image: event.image_url ? [event.image_url] : undefined,
      url: canonical,
      offers: event.price
        ? {
            '@type': 'Offer',
            price: String(event.price),
            priceCurrency: 'INR',
            url: canonical
          }
        : undefined
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: event.title,
      description: event.summary || event.description || '',
      image: event.image_url ? [event.image_url] : undefined,
      offers: event.price
        ? {
            '@type': 'Offer',
            price: String(event.price),
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: canonical
          }
        : undefined
    }
  ];

  const schemaJson = schemaFromDb || fallbackSchema;

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* ✅ JSON-LD SCHEMA OUTPUT */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* HERO SECTION */}
      <div className="relative h-[60vh] overflow-hidden">
        <EventImage src={featuredImageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/70 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <Link href="/events" className="inline-flex items-center text-cream-200 mb-4 hover:text-terracotta-400">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>

            <Badge className="bg-terracotta-500 text-white mb-4">{event.category || 'Event'}</Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-cream-50 mb-4">{event.title}</h1>
            <p className="text-xl text-cream-200 max-w-3xl">{event.summary}</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-2 space-y-8">

          {/* ✅ HTML DESCRIPTION */}
          <Card className="bg-charcoal-900 border-terracotta-500/10">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-cream-50 mb-6">Event Details</h2>
              <div
                className="prose prose-invert max-w-none text-cream-300"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </CardContent>
          </Card>

          {/* HIGHLIGHTS */}
          {event.highlights?.length > 0 && (
            <Card className="bg-charcoal-900 border-terracotta-500/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-cream-50 mb-6">Event Highlights</h2>
                <ul className="space-y-3">
                  {event.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex items-start text-cream-300">
                      <div className="w-6 h-6 rounded-full bg-terracotta-500/20 flex items-center justify-center mr-3">
                        <Check className="h-4 w-4 text-terracotta-400" />
                      </div>
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* GALLERY */}
          {galleryImages.length > 0 && (
            <Card className="bg-charcoal-900 border-terracotta-500/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-cream-50 mb-6">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.map((img: string, idx: number) => (
                    <div key={idx} className="relative h-48 rounded-xl overflow-hidden border border-terracotta-500/20">
                      <GalleryImage src={img} alt={`${event.title} gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SIMILAR EVENTS */}
          {similarEvents.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-cream-50 mb-8">Similar Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {similarEvents.map((ev) => (
                  <Card key={ev.id} className="bg-charcoal-900 border-terracotta-500/20">
                    <div className="relative h-48 overflow-hidden">
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                    </div>

                    <CardContent className="p-5 space-y-3">
                      <h3 className="text-xl font-semibold text-cream-50">{ev.title}</h3>
                      <p className="text-sm text-cream-300">{ev.summary}</p>
                      <div className="flex items-center text-sm text-cream-300">
                        <Calendar className="h-4 w-4 mr-2 text-terracotta-400" />
                        {ev.start_date
                          ? new Date(ev.start_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Date TBA'}
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full bg-terracotta-500 text-white">
                        <Link href={`/events/${ev.slug}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 bg-charcoal-900 border-terracotta-500/20">
            <CardContent className="pt-6 space-y-6">
              {event.start_date && (
                <div className="flex items-center text-cream-300">
                  <Calendar className="h-5 w-5 text-terracotta-400 mr-3" />
                  <div>
                    <p className="text-sm text-cream-400">Date</p>
                    <p className="font-semibold text-cream-50">
                      {new Date(event.start_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center text-cream-300">
                  <MapPin className="h-5 w-5 text-cream-400 mr-3" />
                  <div>
                    <p className="text-sm text-cream-400">Location</p>
                    <p className="font-semibold text-cream-50">{event.location}</p>
                  </div>
                </div>
              )}

              {event.price && (
                <div className="flex items-center text-cream-300">
                  <span className="text-gold-400 text-lg font-bold mr-3">₹</span>
                  <div>
                    <p className="text-sm text-cream-400">Price</p>
                    <p className="font-semibold text-cream-50">{event.price}</p>
                  </div>
                </div>
              )}

              {event.max_participants && (
                <div className="flex items-center text-cream-300">
                  <Users className="h-5 w-5 text-terracotta-400 mr-3" />
                  <div>
                    <p className="text-sm text-cream-400">Capacity</p>
                    <p className="font-semibold text-cream-50">
                      Up to {event.max_participants} guests
                    </p>
                  </div>
                </div>
              )}

              <Button asChild className="w-full bg-terracotta-500 text-white" size="lg">
                <Link href="tel:+919063679687">
                  <Phone className="mr-2 h-5 w-5" />
                  Call to Inquire
                </Link>
              </Button>

              <div className="p-4 bg-terracotta-500/10 border border-terracotta-500/20 rounded-xl text-center">
                <p className="text-sm text-cream-300">
                  Contact us for pricing & customization — 9063679687
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
