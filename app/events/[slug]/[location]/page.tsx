// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// dynamic import (avoid name collision with export const dynamic)
const GalleryClient = dynamicImport<any>(
  () => import("@/app/components/gallery-client").then((m) => m.default || m),
  { ssr: false }
);

export const revalidate = 0;
export const dynamic = "force-dynamic";

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

async function getLocationBySlug(slug: string) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("getLocationBySlug", error);
  return data;
}

async function getLocationPage(productId: string, locationId: string) {
  const { data, error } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "event")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();
  if (error) console.error("getLocationPage", error);
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ev = await getEventBySlug(params.slug);
  const loc = await getLocationBySlug(params.location);

  if (!ev || !loc) {
    return { title: "Event Not Found | Retreat Arcade" };
  }

  // try fetching location_page to get SEO overrides
  const lp = await getLocationPage(ev.id, loc.id);

  const title =
    lp?.seo_title || lp?.title || `Best ${ev.title} in ${loc.name} – Affordable Prices`;
  const description = lp?.seo_description || ev.meta_description || ev.summary || (ev.description ? ev.description.replace(/<[^>]+>/g, "").slice(0, 160) : "");
  const image = ev.image_url || undefined;
  const canonical = lp?.slug
    ? `https://www.retreatarcade.in/events/${ev.slug}/${loc.slug}`
    : `https://www.retreatarcade.in/events/${ev.slug}/${loc.slug}`;

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

export default async function EventLocationPage({ params }: Props) {
  const ev = await getEventBySlug(params.slug);
  if (!ev) return notFound();

  const loc = await getLocationBySlug(params.location);
  if (!loc) return notFound();

  const lp = await getLocationPage(ev.id, loc.id);

  // combine gallery images (supports stored array or JSON-string)
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(ev.gallery_images)) {
      galleryImages = ev.gallery_images.map((u: string) => convertToDirectImageUrl(u));
    } else if (typeof ev.gallery_images === "string" && ev.gallery_images.trim()) {
      const parsed = JSON.parse(ev.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u: string) => convertToDirectImageUrl(u));
    }
  } catch (err) {
    console.warn("gallery parse", err);
  }

  const featuredImage = ev.image_url ? convertToDirectImageUrl(ev.image_url) : "/default-image.jpg";

  // Determine price (override if location page specifies override)
  const price = lp?.override_price ?? ev.price ?? ev.price_from ?? null;

  // JSON-LD schema: prefer lp.schema_json if present else create one
  const schemaJson = lp?.schema_json || {
    "@context": "https://schema.org",
    "@type": "Product",
    name: lp?.title || `${ev.title} - ${loc.name}`,
    description: lp?.seo_description || ev.summary || ev.description || "",
    image: ev.image_url ? [ev.image_url] : undefined,
    offers: price ? {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://www.retreatarcade.in/events/${ev.slug}/${loc.slug}`,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 h-[50vh] sm:h-[60vh] lg:h-[70vh] relative">
          <Image src={featuredImage} alt={ev.title} fill className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
              {lp?.title || `Best ${ev.title} in ${loc.name} – Affordable Prices`}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">{lp?.seo_description || ev.summary}</p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-2xl shadow border sticky top-32 space-y-6">
            {price && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-gray-500">Starting From</p>
                  <p className="text-lg font-bold">₹{Number(price).toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            <a href="tel:+919063679687" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg">Call to Book</a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
              <p className="text-gray-600">{ev.category || "Photobooth"}</p>
            </div>

            <div>
              <Link href={`/events/${ev.slug}`} className="text-sm text-blue-600 underline">View main event page</Link>
            </div>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: ev.description }} />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-white rounded-2xl p-6 shadow">
              <h2 className="text-2xl font-bold mb-6">Gallery</h2>
              {/* @ts-ignore */}
              <GalleryClient images={galleryImages} />
            </article>
          )}

          <section>
            <h3 className="text-3xl font-bold mb-6">More from Retreat Arcade</h3>
            <p>Explore our other photobooth options and event games — we deliver across multiple cities.</p>
            <div className="mt-6">
              <Link href="/services/photobooth-rentals" className="text-amber-600 underline">View all photobooth services</Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
