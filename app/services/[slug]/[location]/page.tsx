// app/services/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import dynamicImport from "next/dynamic";

type Props = { params: { slug: string; location: string } };

const GalleryClient = dynamicImport<any>(() => import("@/app/components/gallery-client").then(m => m?.default ?? m), { ssr: false });

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getServiceBySlug(slug: string) {
  const { data, error } = await supabase.from("services").select("*").eq("slug", slug).eq("status","published").maybeSingle();
  if (error) console.error("getServiceBySlug", error);
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service Not Found | Retreat Arcade" };

  const location = params.location.replace(/-/g, " ");
  const title = `Best ${service.title} in ${location.charAt(0).toUpperCase() + location.slice(1)} – Affordable Prices`;
  const description = service.meta_description || service.summary || (service.description ? service.description.replace(/<[^>]+>/g, "").slice(0,160) : "");
  const canonical = service.canonical_url || `https://www.retreatarcade.in/services/${service.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: service.image_url ? [service.image_url] : undefined },
    twitter: { card: "summary_large_image", title, description, images: service.image_url ? [service.image_url] : undefined },
  };
}

export default async function ServiceLocationPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return notFound();

  const locationSlug = params.location;
  const locationName = locationSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(service.gallery_images)) galleryImages = service.gallery_images.map((u:any)=>convertToDirectImageUrl(u));
    else if (typeof service.gallery_images === "string" && service.gallery_images.trim()) {
      const parsed = JSON.parse(service.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u:any)=>convertToDirectImageUrl(u));
    }
  } catch (err) {
    console.warn("gallery parse", err);
  }

  const featuredImage = service.image_url ? convertToDirectImageUrl(service.image_url) : "/default-image.jpg";

  // schema generation (service)
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} - ${locationName}`,
    description: service.summary || service.description || "",
    image: service.image_url ? [service.image_url] : undefined,
    provider: { "@type": "Organization", name: "Retreat Arcade", url: "https://www.retreatarcade.in" },
    offers: {
      "@type": "Offer",
      price: service.price_from ? String(service.price_from) : undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://www.retreatarcade.in/services/${service.slug}/${locationSlug}`,
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 h-[44vh] sm:h-[52vh] lg:h-[60vh] relative">
          <Image src={featuredImage} alt={service.title} fill className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
              Best {service.title} in {locationName} – Affordable Prices
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">{service.summary}</p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-2xl shadow border sticky top-32 space-y-6">
            {service.price_from && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-gray-500">Starting From</p>
                  <p className="text-lg font-bold">₹{Number(service.price_from).toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            <a href="tel:+919063679687" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg">Call to Book</a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
              <p className="text-gray-600">{service.category || 'Photobooth'}</p>
            </div>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Service Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: service.description }} />
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
