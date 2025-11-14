// app/services/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamicImport<any>(
  () => import("@/app/components/gallery-client").then((m) => m.default || m),
  { ssr: false }
);

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
    .eq("product_type", "service")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();
  if (error) console.error("getLocationPage", error);
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const svc = await getServiceBySlug(params.slug);
  const loc = await getLocationBySlug(params.location);

  if (!svc || !loc) {
    return { title: "Service Not Found | Retreat Arcade" };
  }

  const lp = await getLocationPage(svc.id, loc.id);

  const title = lp?.seo_title || lp?.title || `Best ${svc.title} in ${loc.name} – Affordable Prices`;
  const description = lp?.seo_description || svc.meta_description || svc.summary || (svc.description ? svc.description.replace(/<[^>]+>/g, "").slice(0, 160) : "");
  const image = svc.image_url || undefined;
  const canonical = lp?.slug ? `https://www.retreatarcade.in/services/${svc.slug}/${loc.slug}` : `https://www.retreatarcade.in/services/${svc.slug}/${loc.slug}`;

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

export default async function ServiceLocationPage({ params }: Props) {
  const svc = await getServiceBySlug(params.slug);
  if (!svc) return notFound();

  const loc = await getLocationBySlug(params.location);
  if (!loc) return notFound();

  const lp = await getLocationPage(svc.id, loc.id);

  // gallery parse
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(svc.gallery_images)) {
      galleryImages = svc.gallery_images.map((u: string) => convertToDirectImageUrl(u));
    } else if (typeof svc.gallery_images === "string" && svc.gallery_images.trim()) {
      const parsed = JSON.parse(svc.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u: string) => convertToDirectImageUrl(u));
    }
  } catch (err) {
    console.warn("gallery parse", err);
  }

  const featuredImage = svc.image_url ? convertToDirectImageUrl(svc.image_url) : "/default-image.jpg";

  const price = lp?.override_price ?? svc.price_from ?? null;

  const schemaJson = lp?.schema_json || {
    "@context": "https://schema.org",
    "@type": "Service",
    name: lp?.title || `${svc.title} - ${loc.name}`,
    description: lp?.seo_description || svc.summary || svc.description || "",
    image: svc.image_url ? [svc.image_url] : undefined,
    offers: price ? {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://www.retreatarcade.in/services/${svc.slug}/${loc.slug}`,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 h-[44vh] sm:h-[52vh] lg:h-[60vh] relative">
          <Image src={featuredImage} alt={svc.title} fill className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
              {lp?.title || `Best ${svc.title} in ${loc.name} – Affordable Prices`}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">{lp?.seo_description || svc.summary}</p>
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
              <p className="text-gray-600">{svc.category || "Photobooth"}</p>
            </div>

            <div>
              <Link href={`/services/${svc.slug}`} className="text-sm text-blue-600 underline">View main service page</Link>
            </div>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Service Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: svc.description }} />
          </article>

          {galleryImages.length > 0 && (
            <article className="bg-white rounded-2xl p-6 shadow">
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
