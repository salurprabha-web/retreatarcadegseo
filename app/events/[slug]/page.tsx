/* Event Detail Page — Clean product view (no date/location fields) */

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

// ------------------ METADATA ------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };

  const title = event.meta_title || event.title;
  const description =
    event.meta_description ||
    event.summary ||
    (event.description ? event.description.replace(/<[^>]+>/g, "").slice(0, 160) : "");

  const keywords = event.meta_keywords?.length ? event.meta_keywords.join(",") : "";
  const image = event.image_url || undefined;
  const canonical =
    event.canonical_url ||
    `https://www.retreatarcade.in/events/${event.slug}`;

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

// ------------------ PAGE ------------------
export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const similarEvents = await getSimilarEvents(event.category, event.id);

  // ------------------ MAIN IMAGE ------------------
  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  // ------------------ FIXED GALLERY HANDLING ------------------
  let galleryImages: string[] = [];

  try {
    if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images;
    } else if (typeof event.gallery_images === "string") {
      galleryImages = JSON.parse(event.gallery_images);
    }
  } catch {
    galleryImages = [];
  }

  galleryImages = galleryImages.map((url: string) =>
    convertToDirectImageUrl(url)
  );

  // ------------------ SCHEMA ------------------
  const domain = "https://www.retreatarcade.in";
  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;

  const schemaFromDb =
    event.schema_json &&
    typeof event.schema_json === "object" &&
    Object.keys(event.schema_json).length > 0
      ? event.schema_json
      : null;

  const fallbackSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: event.title,
      description: event.summary || event.description || "",
      image: event.image_url ? [event.image_url] : undefined,
      offers: event.price
        ? {
            "@type": "Offer",
            price: String(event.price),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: canonical,
          }
        : undefined,
    },
  ];

  const schemaJson = schemaFromDb || fallbackSchema;

  return (
    <div className="min-h-screen bg-charcoal-950 pt-24">

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      {/* ================= MAIN IMAGE ================= */}
      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <EventImage
            src={featuredImageUrl}
            alt={event.title}
            className="w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] object-cover"
          />
        </div>
      </section>

      {/* ================= TITLE ================= */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cream-50 text-center mb-10 px-4 leading-tight">
        {event.title}
      </h1>

      {/* ================= MAIN GRID ================= */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">

        {/* SIDEBAR */}
        <aside className="order-1 lg:order-2">
          <Card className="bg-charcoal-900 border-terracotta-500/20 sticky top-32 p-6 space-y-6 rounded-2xl shadow-xl">

            {event.price && (
              <div className="bg-charcoal-800 p-5 rounded-xl border border-terracotta-500/20 flex items-center">
                <span className="text-gold-400 text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-cream-400">Starting From</p>
                  <p className="text-cream-50 text-2xl font-bold">
                    {Number(event.price).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            <Button
              asChild
              size="lg"
              className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white py-5 text-lg rounded-xl"
            >
              <Link href="tel:+919063679687">
                <Phone className="mr-3 h-6 w-6" /> Call to Inquire
              </Link>
            </Button>

          </Card>
        </aside>

        {/* LEFT CONTENT */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">

          {/* DESCRIPTION */}
          <Card className="bg-charcoal-900 border-terracotta-500/10">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-cream-50 mb-4">Event Details</h2>

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
                <h2 className="text-2xl font-bold text-cream-50 mb-6">Gallery</h2>

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

          {/* Similar Events */}
          {similarEvents.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-cream-50 mb-6">
                Similar Events
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarEvents.map((ev: any) => (
                  <Card key={ev.id} className="bg-charcoal-900 border-terracotta-500/20">
                    <EventImage
                      src={convertToDirectImageUrl(ev.image_url || "")}
                      alt={ev.title}
                      className="w-full h-44 object-cover rounded-t"
                    />

                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-lg font-semibold text-cream-50">{ev.title}</h3>
                      <p className="text-sm text-cream-300 line-clamp-3">{ev.summary}</p>
                    </CardContent>

                    <CardFooter>
                      <Button asChild className="w-full bg-terracotta-500 text-white">
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
