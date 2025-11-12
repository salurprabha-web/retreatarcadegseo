/*
  Retreat Arcade | Event Detail Page
  ✨ Polished Hero Section (Natural Scaling)
  ✨ No navbar overlap on mobile
  ✨ Fully responsive cinematic layout
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage, GalleryImage } from "@/components/event-image";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

// ✅ Fetch single event
async function getEvent(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("Event fetch error:", error);
  return data;
}

// ✅ Fetch similar events
async function getSimilarEvents(category: string, currentEventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("category", category)
    .neq("id", currentEventId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Similar events error:", error);
    return [];
  }
  return data || [];
}

// ✅ SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };

  const title = event.meta_title || event.title;
  const description =
    event.meta_description ||
    event.summary ||
    (event.description
      ? event.description.replace(/<[^>]+>/g, "").slice(0, 160)
      : "");

  const keywords = event.meta_keywords?.length
    ? event.meta_keywords.join(",")
    : "";
  const image = event.image_url || undefined;
  const canonical =
    event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}`;

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
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const similarEvents = await getSimilarEvents(event.category, event.id);
  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  const galleryImages = Array.isArray(event.gallery_images)
    ? event.gallery_images.map((url: string) => convertToDirectImageUrl(url))
    : [];

  const domain = "https://www.retreatarcade.in";
  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;
  const schemaFromDb =
    event.schema_json && Object.keys(event.schema_json).length > 0
      ? event.schema_json
      : null;

  const fallbackSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.summary || event.description || "",
      image: event.image_url ? [event.image_url] : undefined,
      url: canonical,
      offers: event.price
        ? {
            "@type": "Offer",
            price: String(event.price),
            priceCurrency: "INR",
            url: canonical,
          }
        : undefined,
    },
  ];
  const schemaJson = schemaFromDb || fallbackSchema;

  return (
    <div className="min-h-screen bg-charcoal-950">
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* ================= HERO SECTION ================= */}
      <header className="relative w-full bg-charcoal-900 pt-[6rem] sm:pt-[7rem]">
        {/* Natural scaling instead of aspect-ratio */}
        <div className="relative w-full min-h-[70vh] sm:min-h-[75vh] lg:min-h-[85vh] overflow-hidden group">
          <EventImage
            src={featuredImageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[8000ms] ease-out group-hover:scale-105"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/60 to-transparent" />

          {/* Text overlay — bottom on mobile, center on desktop */}
          <div className="absolute inset-0 flex flex-col justify-end sm:justify-center items-start sm:items-center text-left sm:text-center px-6 pb-10 sm:pb-0">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-cream-50 mb-3 drop-shadow-md leading-tight">
                {event.title}
              </h1>
              {event.summary && (
                <p className="text-cream-200 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
                  {event.summary}
                </p>
              )}
              <div className="mt-6">
                <Button
                  asChild
                  size="lg"
                  className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full px-8 shadow-lg shadow-terracotta-900/50"
                >
                  <Link href="tel:+919063679687">
                    <Phone className="mr-2 h-5 w-5" />
                    Book Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* PRICE SIDEBAR */}
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <Card className="bg-charcoal-900 border-terracotta-500/20 sticky top-28">
            <CardContent className="pt-6 space-y-6">
              {event.price && (
                <div className="flex items-center text-cream-300">
                  <span className="text-gold-400 text-lg font-bold mr-3">₹</span>
                  <div>
                    <p className="text-sm text-cream-400">Starting From</p>
                    <p className="font-semibold text-cream-50">
                      ₹{Number(event.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}
              <Button
                asChild
                className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                size="lg"
              >
                <Link href="tel:+919063679687">
                  <Phone className="mr-2 h-5 w-5" />
                  Call to Inquire
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* EVENT DETAILS */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-10">
          <Card className="bg-charcoal-900 border-terracotta-500/10">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-cream-50 mb-4">
                Event Details
              </h2>
              <div
                className="prose prose-invert max-w-none text-cream-300"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </CardContent>
          </Card>

          {/* GALLERY */}
          {galleryImages.length > 0 && (
            <Card className="bg-charcoal-900 border-terracotta-500/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-cream-50 mb-6">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {galleryImages.map((img: string, idx: number) => (
                    <GalleryImage
                      key={idx}
                      src={img}
                      alt={`${event.title} gallery ${idx + 1}`}
                      className="w-full h-44 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SIMILAR EVENTS */}
          {similarEvents.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-cream-50 mb-6">
                Similar Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarEvents.map((ev: any) => (
                  <Card
                    key={ev.id}
                    className="bg-charcoal-900 border-terracotta-500/20"
                  >
                    <EventImage
                      src={convertToDirectImageUrl(ev.image_url || "")}
                      alt={ev.title}
                      className="w-full h-44 object-cover rounded-t"
                    />
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-lg font-semibold text-cream-50">
                        {ev.title}
                      </h3>
                      <p className="text-sm text-cream-300 line-clamp-3">
                        {ev.summary}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        asChild
                        className="w-full bg-terracotta-500 text-white"
                      >
                        <Link href={`/events/${ev.slug}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
