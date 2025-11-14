// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import dynamicImport from "next/dynamic";

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamicImport<any>(() => import("@/app/components/gallery-client").then(m => m?.default ?? m), { ssr: false });

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getEventBySlug(slug: string) {
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).eq("status","published").maybeSingle();
  if (error) console.error("getEventBySlug", error);
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };

  const location = params.location.replace(/-/g, " ");
  const title = `Best ${event.title} in ${location.charAt(0).toUpperCase() + location.slice(1)} – Affordable Prices`;
  const description = event.meta_description || event.summary || (event.description ? event.description.replace(/<[^>]+>/g, "").slice(0,160) : "");
  const canonical = event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: event.image_url ? [event.image_url] : undefined },
    twitter: { card: "summary_large_image", title, description, images: event.image_url ? [event.image_url] : undefined },
  };
}

export default async function EventLocationPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) return notFound();

  const locationSlug = params.location;
  const locationName = locationSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // parse gallery images
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) galleryImages = event.gallery_images.map((u:any)=>convertToDirectImageUrl(u));
    else if (typeof event.gallery_images === "string" && event.gallery_images.trim()) {
      const parsed = JSON.parse(event.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u:any)=>convertToDirectImageUrl(u));
    }
  } catch (err) { console.warn("gallery parse", err); }

  const featuredImage = event.image_url ? convertToDirectImageUrl(event.image_url) : "/default-image.jpg";

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${event.title} - ${locationName}`,
    description: event.summary || event.description || "",
    image: event.image_url ? [event.image_url] : undefined,
    offers: event.price ? {
      "@type": "Offer",
      price: String(event.price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://www.retreatarcade.in/events/${event.slug}/${locationSlug}`,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 h-[50vh] sm:h-[60vh] lg:h-[70vh]">
          <div className="relative w-full h-full">
            <Image src={featuredImage} alt={event.title} fill className="object-contain w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
            <div className="absolute left-6 bottom-6 z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Best {event.title} in {locationName} – Affordable Prices
              </h1>
              <p className="mt-2 text-sm text-white/80 max-w-xl">{event.summary}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-2xl shadow border sticky top-32 space-y-6">
            {event.price && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-gray-500">Starting From</p>
                  <p className="text-lg font-bold">₹{Number(event.price).toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            <a href="tel:+919063679687" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg">Call to Inquire</a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
              <p className="text-gray-600">{event.category || 'Photobooth'}</p>
            </div>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
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
              <Link href="/services/photobooth-rentals" className="text-blue-600 underline">View all photobooth services</Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
