// app/services/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamic(
  () =>
    import("@/app/components/gallery-client").then(
      (mod) => mod.default || mod
    ),
  { ssr: false }
);

export const revalidate = 0;
export const dynamic = "force-dynamic";

// -----------------------------
// Fetch service
// -----------------------------
async function getService(slug: string) {
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data;
}

// -----------------------------
// Fetch location override
// -----------------------------
async function getLocationPage(serviceId: string, locationSlug: string) {
  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", locationSlug)
    .maybeSingle();

  if (!location) return null;

  const { data: locPage } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "service")
    .eq("product_id", serviceId)
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
  const service = await getService(params.slug);
  if (!service) return { title: "Service Not Found" };

  const locPage = await getLocationPage(service.id, params.location);
  const locationName = params.location.replace(/-/g, " ");

  const title =
    locPage?.seo_title ||
    `Best ${service.title} in ${locationName} – Affordable Prices`;

  const description =
    locPage?.seo_description ||
    service.meta_description ||
    service.summary ||
    "";

  const canonical = `https://www.retreatarcade.in/services/${service.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [service.image_url],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [service.image_url],
    },
  };
}

// -----------------------------
// PAGE RENDER
// -----------------------------
export default async function ServiceLocationPage({
  params,
}: Props) {
  const service = await getService(params.slug);
  if (!service) return notFound();

  const locPage = await getLocationPage(service.id, params.location);

  const locationName = params.location
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const featuredImage = convertToDirectImageUrl(service.image_url);

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(service.gallery_images)) {
      galleryImages = service.gallery_images.map((u: string) =>
        convertToDirectImageUrl(u)
      );
    } else if (typeof service.gallery_images === "string") {
      const parsed = JSON.parse(service.gallery_images);
      if (Array.isArray(parsed)) {
        galleryImages = parsed.map((u: string) =>
          convertToDirectImageUrl(u)
        );
      }
    }
  } catch {}

  const schema = locPage?.schema_json || {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} in ${locationName}`,
    description: service.summary || "",
    image: [service.image_url],
    offers: {
      "@type": "Offer",
      price:
        locPage?.override_price ??
        (service.price_from ? String(service.price_from) : undefined),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* HERO */}
      <section className="px-4 max-w-6xl mx-auto mb-10">
        <div className="relative h-[60vh] rounded-xl overflow-hidden shadow-xl border border-gray-200">
          <Image
            src={featuredImage}
            alt={service.title}
            fill
            className="object-contain bg-white"
          />
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-sm p-4 rounded-lg">
            <h1 className="text-4xl font-bold text-white">
              Best {service.title} in {locationName}
            </h1>
            <p className="mt-2 text-gray-200 max-w-xl">
              {service.summary}
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        {/* SIDEBAR */}
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-xl shadow border sticky top-28">
            {service.price_from && (
              <div className="p-4 rounded-xl border mb-6 bg-gray-50">
                <p className="text-sm text-gray-500">Starting From</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Number(service.price_from).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            <a
              href="tel:+919063679687"
              className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg mb-6"
            >
              Call to Book
            </a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Category
              </h4>
              <p className="text-gray-600">{service.category}</p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-2xl font-bold mb-4">
              Service Details
            </h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: service.description }}
            />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-white p-6 rounded-xl shadow border">
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
