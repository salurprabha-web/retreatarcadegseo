// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamicImport from "next/dynamic";

import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamicImport<any>(
  () =>
    import("@/app/components/gallery-client").then((mod) => mod.default || mod),
  { ssr: false },
);

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getEventBySlug(slug: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

async function getLocationBySlug(slug: string) {
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getLocationPageForEvent(eventId: string, locationId: string) {
  const { data } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "event")
    .eq("product_id", eventId)
    .eq("location_id", locationId)
    .maybeSingle();
  return data;
}

async function getLocationPageBySlug(slug: string) {
  const { data } = await supabase
    .from("location_pages")
    .select("*, locations(*)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };

  let location = await getLocationBySlug(params.location);

  if (!location) {
    const lp = await getLocationPageBySlug(params.location);
    if (lp?.locations) location = lp.locations;
  }

  const locationName = location?.name || params.location.replace(/-/g, " ");

  let lpOverride = null;
  if (location?.id) {
    lpOverride = await getLocationPageForEvent(event.id, location.id);
  }

  const title =
    lpOverride?.seo_title ||
    lpOverride?.title ||
    `Best ${event.title} in ${locationName} – Event Services`;

  const desc =
    lpOverride?.seo_description ||
    event.meta_description ||
    event.summary ||
    (event.description || "").replace(/<[^>]+>/g, "").slice(0, 160);

  const image = lpOverride?.schema_json?.image || event.image_url;

  const canonical =
    lpOverride?.canonical_url ||
    `https://www.retreatarcade.in/events/${event.slug}/${location?.slug ?? params.location}`;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      images: image ? [image] : undefined,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
  };
}

export default async function EventLocationPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) return notFound();

  if (!params.location || params.location === "undefined") {
    return redirect(`/events/${event.slug}`);
  }

  let location = await getLocationBySlug(params.location);

  if (!location) {
    const lp = await getLocationPageBySlug(params.location);
    if (lp?.locations) {
      return redirect(
        `/events/${event.slug}/${lp.locations.slug}`,
      );
    }
    return notFound();
  }

  const locationPage = await getLocationPageForEvent(event.id, location.id);

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images))
      galleryImages = event.gallery_images.map(convertToDirectImageUrl);
    else if (typeof event.gallery_images === "string") {
      const arr = JSON.parse(event.gallery_images);
      galleryImages = arr.map(convertToDirectImageUrl);
    }
  } catch {}

  const featured = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "/default-image.jpg";

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.title} — ${location.name}`,
    description: event.summary || event.description || "",
    image: featured,
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: location.name,
    },
  };

  const schema = locationPage?.schema_json
    ? { ...baseSchema, ...locationPage.schema_json }
    : baseSchema;

  const pageTitle =
    locationPage?.title || `Best ${event.title} in ${location.name}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border relative h-[44vh] sm:h-[52vh]">
          <Image src={featured} alt={event.title} fill className="object-contain" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-4xl font-bold text-white">{pageTitle}</h1>
            <p className="text-white/80 mt-1">{event.summary}</p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="p-6 rounded-xl shadow border sticky top-32 space-y-6">
            <a href="tel:+919063679687" className="block bg-amber-500 py-3 text-center text-white rounded-lg">
              Call to Book
            </a>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{
                __html: locationPage?.custom_description || event.description,
              }}
            />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-white rounded-xl p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              {/* @ts-ignore */}
              <GalleryClient images={galleryImages} />
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
