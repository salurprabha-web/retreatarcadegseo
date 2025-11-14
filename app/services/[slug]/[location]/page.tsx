// app/services/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamicImport from "next/dynamic";

import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// dynamic import of the client gallery (works when the component default-exports)
const GalleryClient = dynamicImport<any>(
  () =>
    import("@/app/components/gallery-client").then((mod) => mod.default || mod),
  { ssr: false }
);

// prevent stale caching in ISR context — keep as you had
export const revalidate = 0;
export const dynamic = "force-dynamic";

/* Helper: fetch service by slug (published only) */
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

/* Helper: fetch location by slug */
async function getLocationBySlug(slug: string) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) console.error("getLocationBySlug", error);
  return data;
}

/* Helper: fetch location_page for product+location (service) */
async function getLocationPageForService(productId: string, locationId: string) {
  const { data, error } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "service")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) console.error("getLocationPageForService", error);
  return data;
}

/* Used to locate a location_page by slug (old/broken URL detection) */
async function getLocationPageBySlug(slug: string) {
  const { data, error } = await supabase
    .from("location_pages")
    .select("*, locations(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) console.error("getLocationPageBySlug", error);
  return data;
}

/* ---------------------------
   METADATA (OpenGraph + Twitter)
   --------------------------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: "Service Not Found | Retreat Arcade" };

  // try to resolve location by slug
  const location = await getLocationBySlug(params.location);

  // if params.location is not a location slug, it may be a legacy location_page slug.
  // we still produce metadata using the real location where possible.
  let locationObj = location;
  if (!locationObj) {
    // if it's a location_page slug, find its linked location
    const lp = await getLocationPageBySlug(params.location);
    if (lp && lp.location_id && lp.locations) {
      locationObj = lp.locations;
    }
  }

  const locationName = locationObj ? locationObj.name : params.location.replace(/-/g, " ");
  // fetch possible location_page overrides (by product+location) - only if location exists
  let lpOverride: any = null;
  if (locationObj && service?.id) {
    lpOverride = await getLocationPageForService(service.id, locationObj.id);
  }

  // title and description prefer overrides
  const title =
    lpOverride?.seo_title ||
    lpOverride?.title ||
    `Best ${service.title} in ${locationName} – Affordable Prices`;

  const description =
    lpOverride?.seo_description ||
    service.meta_description ||
    service.summary ||
    (service.description ? service.description.replace(/<[^>]+>/g, "").slice(0, 160) : "");

  const image = (lpOverride?.schema_json && lpOverride.schema_json?.image) || service.image_url;

  const canonical = lpOverride?.canonical_url || `https://www.retreatarcade.in/services/${service.slug}/${locationObj?.slug || params.location}`;

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

/* ---------------------------
   PAGE COMPONENT
   --------------------------- */
export default async function ServiceLocationPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);
  if (!service) return notFound();

  // 1) If the incoming params.location is literally "undefined" or invalid, redirect to service landing
  if (!params.location || params.location === "undefined") {
    return redirect(`/services/${service.slug}`);
  }

  // 2) Try to resolve location by slug
  let location = await getLocationBySlug(params.location);

  // 3) If not found, check if this params.location matches a location_page.slug (legacy or custom).
  //    If it does, redirect to canonical location-based URL (keeps single canonical per product+location).
  if (!location) {
    const lpBySlug = await getLocationPageBySlug(params.location);
    if (lpBySlug && lpBySlug.location_id) {
      // find actual location record
      const resolvedLoc = await supabase
        .from("locations")
        .select("*")
        .eq("id", lpBySlug.location_id)
        .maybeSingle();

      if (resolvedLoc?.data) {
        // Redirect old URL to canonical service+location path
        const correctLocationSlug = resolvedLoc.data.slug;
        const correctUrl = `/services/${service.slug}/${correctLocationSlug}`;
        return redirect(correctUrl);
      }
    }
    // not found anywhere — still show notFound
    return notFound();
  }

  // 4) get location_page override (if any) for this service+location
  const locationPage = await getLocationPageForService(service.id, location.id);

  // parse gallery_images (support stringified JSON or array)
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(service.gallery_images)) {
      galleryImages = service.gallery_images.map((u: string) => convertToDirectImageUrl(u));
    } else if (typeof service.gallery_images === "string" && service.gallery_images.trim().length > 0) {
      const parsed = JSON.parse(service.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u: string) => convertToDirectImageUrl(u));
    }
  } catch (err) {
    console.warn("gallery parse", err);
    galleryImages = [];
  }

  const featuredImage = service.image_url ? convertToDirectImageUrl(service.image_url) : "/default-image.jpg";

  // Build schema JSON (auto-generate and allow override)
  const baseSchema: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} — ${location.name}`,
    description: service.summary || service.description || "",
    image: service.image_url ? [service.image_url] : undefined,
    offers: {
      "@type": "Offer",
      price: service.price_from ? String(service.price_from) : undefined,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://www.retreatarcade.in/services/${service.slug}/${location.slug}`,
    },
    provider: {
      "@type": "Organization",
      name: "Retreat Arcade",
      url: "https://www.retreatarcade.in",
    },
    areaServed: {
      "@type": "City",
      name: location.name,
    },
  };

  const schemaJson = locationPage?.schema_json ? { ...baseSchema, ...locationPage.schema_json } : baseSchema;

  // Use title override if present
  const pageTitle = locationPage?.title || `Best ${service.title} in ${location.name} – Affordable Prices`;

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 h-[44vh] sm:h-[52vh] lg:h-[60vh] relative">
          <Image src={featuredImage} alt={service.title} fill className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-xl">
              {locationPage?.custom_description || service.summary}
            </p>
            <div className="mt-3 space-x-3">
              <Link href={`/services/${service.slug}`} className="inline-block bg-white/10 px-3 py-2 rounded text-sm text-white/90">View Service</Link>
              <a href={`tel:+919063679687`} className="inline-block bg-amber-500 px-3 py-2 rounded text-sm text-white">Call to Book</a>
            </div>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-2xl shadow border sticky top-32 space-y-6">
            {service.price_from && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-gray-500">Starting From</p>
                  <p className="text-lg font-bold">₹{Number(service.price_from).toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            <a href="tel:+919063679687" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg">Call to Book</a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
              <p className="text-gray-600">{service.category || "Photobooth"}</p>
            </div>

            <div className="text-sm text-gray-500">
              <p>Page slug: <span className="font-mono text-xs">{`/services/${service.slug}/${location.slug}`}</span></p>
            </div>
          </div>
        </aside>

        <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">
          <article className="bg-white rounded-2xl p-6 shadow">
            <h2 className="text-2xl font-bold mb-4">Service Details</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: locationPage?.custom_description || service.description }} />
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
