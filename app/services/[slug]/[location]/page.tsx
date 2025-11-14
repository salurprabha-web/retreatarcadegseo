// app/services/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import dynamicImport from "next/dynamic"; // ✔ FIXED
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// ✔ SAFE dynamic import
const GalleryClient = dynamicImport(
  () =>
    import("@/app/components/gallery-client").then(
      (mod) => mod.default || mod
    ),
  { ssr: false }
);

export const dynamic = "force-dynamic";
export const revalidate = 0;

// --------------------------------------------------
// FETCH SERVICE BY SLUG
// --------------------------------------------------
async function getServiceBySlug(slug: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) console.error("getServiceBySlug", error);
  return data;
}

// --------------------------------------------------
// FETCH LOCATION PAGE (SEO + custom title)
// --------------------------------------------------
async function getLocationPage(productId: string, locationSlug: string) {
  const { data: location } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", locationSlug)
    .maybeSingle();

  if (!location) return null;

  const { data: lp } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "service")
    .eq("product_id", productId)
    .eq("location_id", location.id)
    .maybeSingle();

  return { location, lp };
}

// --------------------------------------------------
// SEO Metadata
// --------------------------------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service Not Found | Retreat Arcade" };

  const loc =
    params.location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const locData = await getLocationPage(service.id, params.location);

  const metaTitle =
    locData?.lp?.seo_title ||
    `Best ${service.title} in ${loc} – Affordable Pricing`;

  const metaDesc =
    locData?.lp?.seo_description ||
    service.short_description ||
    service.description?.replace(/<[^>]+>/g, "").slice(0, 160);

  return {
    title: metaTitle,
    description: metaDesc,
  };
}

// --------------------------------------------------
// PAGE OUTPUT
// --------------------------------------------------
export default async function ServiceLocationPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return notFound();

  const locData = await getLocationPage(service.id, params.location);
  const locationName =
    locData?.location?.city ||
    params.location.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const customTitle =
    locData?.lp?.title || `${service.title} in ${locationName}`;

  // ------------------ Gallery ------------------
  let galleryImages: string[] = [];

  try {
    if (Array.isArray(service.gallery_images)) {
      galleryImages = service.gallery_images.map(convertToDirectImageUrl);
    } else if (typeof service.gallery_images === "string") {
      galleryImages = JSON.parse(service.gallery_images).map(
        convertToDirectImageUrl
      );
    }
  } catch (e) {
    galleryImages = [];
  }

  const featured = service.image_url
    ? convertToDirectImageUrl(service.image_url)
    : "/default-image.jpg";

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-charcoal-950 text-cream-50 pt-24">
      {/* FEATURED IMAGE */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-xl overflow-hidden relative h-[55vh] border">
          <Image
            src={featured}
            alt={service.title}
            fill
            className="object-contain"
          />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 pb-20 grid lg:grid-cols-3 gap-10">
        {/* LEFT CONTENT */}
        <section className="lg:col-span-2 space-y-12">
          <article className="bg-charcoal-900 p-6 rounded-xl border">
            <h1 className="text-3xl font-bold mb-4">{customTitle}</h1>

            <div
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: service.description }}
            />
          </article>

          {/* GALLERY */}
          {galleryImages.length > 0 && (
            <article className="bg-charcoal-900 p-6 rounded-xl border">
              <h2 className="text-2xl mb-6 font-bold">Gallery</h2>

              {/* @ts-ignore */}
              <GalleryClient images={galleryImages} />
            </article>
          )}
        </section>

        {/* RIGHT SIDEBAR */}
        <aside>
          <div className="bg-charcoal-900 p-6 rounded-xl border sticky top-32 space-y-6">
            {service.price && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-3xl font-bold">₹</span>
                <span className="text-xl ml-2">
                  {Number(service.price).toLocaleString("en-IN")}
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
