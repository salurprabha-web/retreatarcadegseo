// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// ✔ Correct dynamic import
const GalleryClient = dynamic(
  () =>
    import("@/app/components/gallery-client").then(
      (mod) => mod.default || mod
    ),
  { ssr: false }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

// -----------------------------
// Fetch event
// -----------------------------
async function getEvent(slug: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

// -----------------------------
// Fetch location page override
// -----------------------------
async function getLocationPage(eventId: string, locationSlug: string) {
  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", locationSlug)
    .maybeSingle();

  if (!location) return null;

  const { data: locPage } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "event")
    .eq("product_id", eventId)
    .eq("location_id", location.id)
    .maybeSingle();

  return locPage;
}

// -----------------------------
// Metadata
// -----------------------------
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: "Event Not Found" };

  const locationName = params.location.replace(/-/g, " ");
  const locPage = await getLocationPage(event.id, params.location);

  const title =
    locPage?.seo_title ||
    `Best ${event.title} in ${locationName} – Affordable Prices`;

  const description =
    locPage?.seo_description ||
    event.meta_description ||
    event.summary ||
    "";

  const canonical = `https://www.retreatarcade.in/events/${event.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [event.image_url],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [event.image_url],
    },
  };
}

// -----------------------------
// PAGE
// -----------------------------
export default async function EventLocationPage({
  params,
}: Props) {
  const event = await getEvent(params.slug);
  if (!event) return notFound();

  const locPage = await getLocationPage(event.id, params.location);

  const locationName = params.location
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const featuredImage = convertToDirectImageUrl(event.image_url);

  // Parse gallery
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images.map((u: string) =>
        convertToDirectImageUrl(u)
      );
    } else if (typeof event.gallery_images === "string") {
      const parsed = JSON.parse(event.gallery_images);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.map((u: string) =>
          convertToDirectImageUrl(u)
        );
      }
    }
  } catch {}

  // Schema
  const schema = locPage?.schema_json || {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${event.title} in ${locationName}`,
    description: event.summary || "",
    image: [event.image_url],
    offers: {
      "@type": "Offer",
      price: event.price ? String(event.price) : undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* HERO */}
      <section className="px-4 max-w-6xl mx-auto mb-10">
        <div className="relative h-[60vh] rounded-xl overflow-hidden">
          <Image
            src={featuredImage}
            alt={event.title}
            fill
            className="object-contain bg-black"
          />
          <div className="absolute bottom-6 left-6">
            <h1 className="text-4xl font-bold">
              Best {event.title} in {locationName}
            </h1>
            <p className="text-gray-300 mt-2">{event.summary}</p>
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <main className="max-w-6xl mx-auto px-4 space-y-12 pb-24">
        <article className="bg-neutral-900 p-6 rounded-xl border border-neutral-700">
          <h2 className="text-2xl font-bold mb-4">
            Event Details
          </h2>
          <div
            className="prose prose-invert"
            dangerouslySetInnerHTML={{ __html: event.description }}
          />
        </article>

        {galleryImages.length > 0 && (
          <article className="bg-neutral-900 p-6 rounded-xl border border-neutral-700">
            <h2 className="text-2xl font-bold mb-6">Gallery</h2>
            {/* @ts-ignore */}
            <GalleryClient images={galleryImages} />
          </article>
        )}
      </main>
    </div>
  );
}
