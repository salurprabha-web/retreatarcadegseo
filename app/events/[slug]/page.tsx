/* Event Detail Page — With Lightbox & Proper Scaling */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Phone, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage, GalleryImage } from "@/components/event-image";
import Lightbox from "./lightbox";

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
    event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: { title, description, images: image ? [image] : undefined, url: canonical },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined }
  };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const similarEvents = await getSimilarEvents(event.category, event.id);

  // Main Image URL
  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  // Gallery Parser (stable)
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) galleryImages = event.gallery_images;
    else if (typeof event.gallery_images === "string")
      galleryImages = JSON.parse(event.gallery_images);
  } catch {}

  galleryImages = galleryImages.map((url) => convertToDirectImageUrl(url)).filter(Boolean);

  const domain = "https://www.retreatarcade.in";
  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;

  const domain = "https://www.retreatarcade.in";

  // ✅ Product/Service schema — use CMS override or auto-generate
  const schemaJson = event.schema_json && Object.keys(event.schema_json).length > 0
    ? event.schema_json
    : {
        "@context": "https://schema.org",
        "@type": "Service",
        name: event.title,
        description: event.summary || "",
        image: event.image_url ? [event.image_url] : undefined,
        url: canonical,
        areaServed: { "@type": "Country", name: "India" },
        provider: {
          "@type": "LocalBusiness",
          name: "Retreat Arcade",
          url: domain,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Madhapur",
            addressRegion: "Telangana",
            postalCode: "500084",
            addressCountry: "IN",
          },
        },
        offers: event.price
          ? {
              "@type": "Offer",
              price: String(event.price),
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
              url: canonical,
            }
          : undefined,
      };

  // ✅ BreadcrumbList schema — unlocks breadcrumb rich results in SERPs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: domain },
      { "@type": "ListItem", position: 2, name: "Products", item: `${domain}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: canonical },
    ],
  };

  // ✅ FAQPage schema — unlocks FAQ dropdown rich results in SERPs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How much does ${event.title} cost in Hyderabad?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: event.price
            ? `${event.title} rental starts from ₹${Number(event.price).toLocaleString("en-IN")} in Hyderabad. Final pricing depends on event duration, location, and customisations. Contact Retreat Arcade for a free quote on +91 9063679687.`
            : `Pricing for ${event.title} in Hyderabad depends on event type, duration, and location. Contact Retreat Arcade for a personalised quote.`,
        },
      },
      {
        "@type": "Question",
        name: `Where does Retreat Arcade provide ${event.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Retreat Arcade provides ${event.title} across Hyderabad (Madhapur, HITEC City, Gachibowli, Banjara Hills, Jubilee Hills, Secunderabad) and other major cities including Bangalore, Chennai, Mumbai, Pune and Delhi.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I book ${event.title} for my event?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Call or WhatsApp Retreat Arcade at +91 9063679687, or fill the contact form at retreatarcade.in/contact. We confirm bookings within 24 hours.",
        },
      },
    ],
  };

  return (
    <>
      {/* ✅ Product/Service schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />
      {/* ✅ BreadcrumbList schema — breadcrumb rich results */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {/* ✅ FAQPage schema — FAQ dropdown rich results */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-charcoal-950 pt-24">

        {/* ================= MAIN IMAGE (NO CROPPING) ================= */}
        <section className="w-full max-w-6xl mx-auto px-4 mb-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <EventImage
              src={featuredImageUrl}
              alt={event.title}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
          </div>
        </section>

        {/* TITLE */}
        {/* TITLE + SUMMARY */}
<div className="max-w-5xl mx-auto px-4 mb-10">
  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cream-50 text-center leading-tight">
    {event.title}
  </h1>

  {event.summary && (
    <p className="mt-6 text-center text-lg md:text-xl text-cream-300 max-w-4xl mx-auto leading-relaxed">
      {event.summary}
    </p>
  )}
</div>

        {/* MAIN GRID */}
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

  {/* ---------------- GALLERY ---------------- */}
  {galleryImages.length > 0 && (
    <section>
      <h2 className="text-2xl font-bold text-cream-50 mb-5">
        Event Gallery
      </h2>

      <Lightbox
        images={galleryImages}
        title={event.title}
      />
    </section>
  )}
{event.highlights && event.highlights.length > 0 && (
  <Card className="bg-charcoal-900 border border-terracotta-500/20 rounded-2xl shadow-xl">
    <CardContent className="p-8">
      <h2 className="text-2xl font-bold text-cream-50 mb-6">
        Key Highlights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {event.highlights.map((highlight: string, index: number) => (
          <div
            key={index}
            className="flex items-start gap-3 bg-charcoal-800 rounded-lg p-4"
          >
            <span className="text-gold-400 text-lg">✓</span>
            <span className="text-cream-300">{highlight}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
  {/* ---------------- DESCRIPTION ---------------- */}
<Card className="bg-charcoal-900 border border-terracotta-500/20 rounded-2xl shadow-xl">
  <CardContent className="p-8 md:p-10">
    <h2 className="text-3xl font-bold text-cream-50 mb-8 border-b border-terracotta-500/20 pb-4">
      Event Details
    </h2>

    <div
      className="event-description"
      dangerouslySetInnerHTML={{
        __html: event.description,
      }}
    />
  </CardContent>
</Card>
  
            {/* SIMILAR EVENTS */}
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
    </>
  );
}
