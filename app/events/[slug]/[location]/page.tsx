/* app/events/[slug]/[location]/page.tsx
   Location-aware Event detail page
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
import dynamic from "next/dynamic";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Props = { params: { slug: string; location: string } };

// Lazy load client lightbox to avoid server rendering
const GalleryLightbox = dynamic(() => import("./GalleryLightbox"), { ssr: false });

/* -------------------------
   Helper fetchers
   ------------------------- */
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

async function getLocationBySlug(slug: string) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) console.error("Location fetch error:", error);
  return data;
}

async function getLocationPage(productId: string, locationId: string) {
  const { data, error } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) console.error("Location page fetch error:", error);
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

/* -------------------------
   Metadata generation
   ------------------------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);
  const location = await getLocationBySlug(params.location);
  if (!event || !location) return { title: "Event Not Found | Retreat Arcade" };

  // You could also fetch location page overrides here if needed
  const title = `${event.title} in ${location.city}`;
  const description =
    event.meta_description ||
    event.summary ||
    (event.description ? event.description.replace(/<[^>]+>/g, "").slice(0, 160) : "");

  const image = event.image_url || undefined;
  const canonical = event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}/${location.slug}`;

  return {
    title,
    description,
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

/* -------------------------
   Page component
   ------------------------- */
export default async function EventLocationPage({ params }: Props) {
  const { slug, location: locationSlug } = params;
  const event = await getEvent(slug);
  const location = await getLocationBySlug(locationSlug);

  if (!event || !location) notFound();

  const locationPage = await getLocationPage(event.id, location.id);
  const similarEvents = await getSimilarEvents(event.category, event.id);

  // Merge logic: prefer location overrides
  const title = locationPage?.custom_title || `${event.title} in ${location.city}`;
  const metaTitle = locationPage?.meta_title || title;
  const description = locationPage?.custom_description || event.summary || event.description || "";
  const price = locationPage?.override_price ?? event.price;

  // Main Image URL (fixing scale: use cover + responsive heights)
  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  // Gallery parser — gallery_images may be stored as JSON-string, array, or '[]'
  let galleryImages: string[] = [];
  try {
    if (typeof event.gallery_images === "string") {
      const parsed = JSON.parse(event.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u: string) => convertToDirectImageUrl(u));
    } else if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images.map((u: string) => convertToDirectImageUrl(u));
    }
  } catch (e) {
    console.warn("Gallery parse error", e);
    galleryImages = [];
  }

  const domain = "https://www.retreatarcade.in";
  const canonical = event.canonical_url || `${domain}/events/${event.slug}/${location.slug}`;

  // Schema fallback and overrides
  const schemaFromDb = locationPage?.schema_json && Object.keys(locationPage.schema_json || {}).length > 0
    ? locationPage.schema_json
    : event.schema_json && Object.keys(event.schema_json || {}).length > 0
    ? event.schema_json
    : null;

  const fallbackSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description.replace(/<[^>]+>/g, "").slice(0, 300),
    image: event.image_url ? [event.image_url] : undefined,
    offers: event.price
      ? {
          "@type": "Offer",
          price: String(price || event.price || 0),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: canonical,
        }
      : undefined,
    areaServed: { "@type": "Place", "name": location.city },
  };

  const schemaJson = schemaFromDb || fallbackSchema;

  return (
    <div className="min-h-screen bg-charcoal-950 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      {/* HERO — use controlled heights for mobile and desktop */}
      <section className="w-full">
        <div className="relative w-full h-[48vh] sm:h-[56vh] md:h-[64vh] lg:h-[72vh] overflow-hidden rounded-b-2xl shadow-lg">
          <EventImage
            src={featuredImageUrl}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 z-10 px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white text-center leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-3xl mx-auto text-sm sm:text-lg text-gray-200 text-center">{description}</p>
            )}
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20 mt-8">
        {/* SIDEBAR */}
        <aside className="order-1 lg:order-2">
          <Card className="bg-charcoal-900 border-terracotta-500/20 sticky top-32 p-6 space-y-6 rounded-2xl shadow-xl">
            {price && (
              <div className="bg-charcoal-800 p-5 rounded-xl border border-terracotta-500/20 flex items-center">
                <span className="text-gold-400 text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-cream-400">Starting From</p>
                  <p className="text-cream-50 text-2xl font-bold">
                    {Number(price).toLocaleString("en-IN")}
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

            <div className="text-sm text-cream-300">
              <p><strong>Available in:</strong> {location.city}</p>
            </div>
          </Card>
        </aside>

        {/* CONTENT */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-8">
          {/* Description */}
          <Card className="bg-charcoal-900 border-terracotta-500/10">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-cream-50 mb-4">Event Details</h2>
              <div className="prose prose-invert max-w-none text-cream-300" dangerouslySetInnerHTML={{ __html: event.description }} />
            </CardContent>
          </Card>

          {/* Gallery with client-side lightbox */}
          {galleryImages.length > 0 && (
            <Card className="bg-charcoal-900 border-terracotta-500/10">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-cream-50 mb-6">Gallery</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {galleryImages.map((img: string, idx: number) => (
                    <button key={idx} className="block" data-img-index={idx} onClick={() => { /* handled in client component */ }}>
                      <GalleryImage
                        src={img}
                        alt={`${title} gallery ${idx + 1}`}
                        className="w-full h-44 object-cover rounded-lg"
                        data-index={idx}
                      />
                    </button>
                  ))}
                </div>

                {/* Lightbox component — pass images */}
                <div className="mt-4">
                  {/* @ts-ignore dynamic client component */}
                  <GalleryLightbox images={galleryImages} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar */}
          {similarEvents.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-cream-50 mb-6">Similar Events</h2>
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
