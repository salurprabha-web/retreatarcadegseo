// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import dynamicImport from "next/dynamic"; // ✔ FIXED
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// ✔ Correct dynamic import
const GalleryClient = dynamicImport(
  () =>
    import("@/app/components/gallery-client").then(
      (mod) => mod.default || mod
    ),
  { ssr: false }
);

export const dynamic = "force-dynamic"; // ✔ OK
export const revalidate = 0;

// -----------------------------
// Fetch event by slug
// -----------------------------
async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) console.error("getEventBySlug", error);
  return data;
}

// -----------------------------
// Metadata — stays same
// -----------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };

  const locName =
    params.location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `Best ${event.title} in ${locName} – Affordable Prices`,
    description:
      event.meta_description ||
      event.summary ||
      event.description?.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

// -----------------------------
// PAGE OUTPUT
// -----------------------------
export default async function EventLocationPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) return notFound();

  const locationName =
    params.location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let galleryImages: string[] = [];

  try {
    if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images.map(convertToDirectImageUrl);
    } else if (typeof event.gallery_images === "string") {
      galleryImages = JSON.parse(event.gallery_images).map(
        convertToDirectImageUrl
      );
    }
  } catch (e) {
    galleryImages = [];
  }

  const featured = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "/default-image.jpg";

  return (
    <div className="min-h-screen bg-charcoal-950 text-cream-50 pt-24">
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-xl overflow-hidden relative h-[55vh] border">
          <Image src={featured} alt={event.title} fill className="object-contain" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-20 grid lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-12">
          <article className="bg-charcoal-900 p-6 rounded-xl border">
            <h1 className="text-3xl font-bold mb-4">
              Best {event.title} in {locationName}
            </h1>
            <div
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-charcoal-900 p-6 rounded-xl border">
              <h2 className="text-2xl mb-6 font-bold">Gallery</h2>

              {/* @ts-ignore */}
              <GalleryClient images={galleryImages} />
            </article>
          )}
        </section>

        <aside>
          <div className="bg-charcoal-900 p-6 rounded-xl border sticky top-32 space-y-6">
            {event.price && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-3xl font-bold">₹</span>
                <span className="text-xl ml-2">
                  {Number(event.price).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <a
              href="tel:+919063679687"
              className="block w-full text-center bg-terracotta-500 py-3 rounded-lg text-white"
            >
              Call to Book
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
