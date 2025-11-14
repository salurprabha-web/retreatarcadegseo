// app/events/[slug]/[location]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import nextDynamic from "next/dynamic"; // rename to avoid collision with export const dynamic
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";

type Props = { params: { slug: string; location: string } };

// Dynamic import of client-only gallery (SSR: false)
const GalleryClient = nextDynamic<any>(
  () =>
    import("@/app/components/gallery-client").then((mod) => {
      // support both default export and named export
      return (mod && (mod.default ?? mod)) as any;
    }),
  { ssr: false }
);

export const revalidate = 0;
// Required Next constant; keep it but avoid naming conflict with import above
export const dynamic = "force-dynamic";

// Helper: fetch event by slug
async function getEventBySlug(slug: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) console.error("getEventBySlug:", error);
  return data;
}

// Helper: fetch location by slug
async function getLocationBySlug(locationSlug: string) {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", locationSlug)
    .maybeSingle();

  if (error) console.error("getLocationBySlug:", error);
  return data;
}

// Helper: fetch location_page entry for this product+location
async function getLocationPageForEvent(productId: string, locationId: string) {
  const { data, error } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_type", "event")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) console.error("getLocationPageForEvent:", error);
  return data;
}

// -----------------------------
// Metadata generator (OpenGraph + Twitter + canonical)
// Uses location_page SEO if present, otherwise event metadata
// -----------------------------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, location } = params;

  const event = await getEventBySlug(slug);
  const loc = await getLocationBySlug(location);

  if (!event || !loc) {
    return {
      title: "Event Not Found | Retreat Arcade",
      description: "The event or location you requested could not be found.",
    };
  }

  const lp = await getLocationPageForEvent(event.id, loc.id);

  const title = lp?.seo_title || lp?.title || `${event.title} in ${loc.city} – Retreat Arcade`;
  const description = lp?.seo_description || event.summary || event.description?.replace(/<[^>]+>/g, "").slice(0, 160) || "";
  const canonical = lp?.canonical_url || `https://www.retreatarcade.in/events/${event.slug}/${loc.slug}`;
  const image = event.image_url || (lp?.image_url ?? undefined);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [image] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

// -----------------------------
// Page component (server)
// -----------------------------
export default async function EventLocationPage({ params }: Props) {
  const { slug, location } = params;

  // Quick sanity: missing params?
  if (!slug || !location) {
    // try to guess and redirect (best-effort)
    try {
      // attempt to find likely event and location
      const guessLoc = await supabase
        .from("locations")
        .select("slug")
        .ilike("slug", `%${location || ""}%`)
        .limit(1)
        .maybeSingle();

      const guessEv = await supabase
        .from("events")
        .select("slug")
        .ilike("slug", `%${slug || ""}%`)
        .limit(1)
        .maybeSingle();

      if (guessLoc?.data?.slug && guessEv?.data?.slug) {
        redirect(`/events/${guessEv.data.slug}/${guessLoc.data.slug}`);
      }
    } catch (e) {
      // ignore
    }
    notFound();
  }

  // Fetch core data
  const event = await getEventBySlug(slug);
  const loc = await getLocationBySlug(location);

  // If event or location not found, attempt to auto-redirect by fuzzy search
  if (!event || !loc) {
    // Try to find nearest match and redirect
    try {
      const [evSearch, locSearch] = await Promise.all([
        supabase.from("events").select("slug").ilike("slug", `%${slug}%`).limit(1).maybeSingle(),
        supabase.from("locations").select("slug").ilike("slug", `%${location}%`).limit(1).maybeSingle(),
      ]);

      const evGuess = evSearch?.data?.slug;
      const locGuess = locSearch?.data?.slug;

      if (evGuess && locGuess) {
        redirect(`/events/${evGuess}/${locGuess}`);
      }
    } catch (err) {
      console.warn("auto-redirect attempt failed", err);
    }

    // no guesses — 404
    return notFound();
  }

  // Get location page override data if present
  const lp = await getLocationPageForEvent(event.id, loc.id);

  // Build the title/description to show on page (prefer location_page overrides)
  const pageTitle = lp?.title || `${event.title} in ${loc.city} – Affordable Prices`;
  const pageDescription = lp?.seo_description || lp?.custom_description || event.summary || event.description || "";

  // Build gallery images (supports array or JSON-string)
  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) {
      galleryImages = event.gallery_images.map((u: string) => convertToDirectImageUrl(u));
    } else if (typeof event.gallery_images === "string" && event.gallery_images.trim().length > 0) {
      const parsed = JSON.parse(event.gallery_images);
      if (Array.isArray(parsed)) galleryImages = parsed.map((u: string) => convertToDirectImageUrl(u));
    }
  } catch (err) {
    console.warn("gallery parse error:", err);
    galleryImages = [];
  }

  const featuredImage = event.image_url ? convertToDirectImageUrl(event.image_url) : "/default-image.jpg";

  // JSON-LD: use provided schema_json if present, otherwise build a Product schema
  let jsonLd: any;
  if (lp?.schema_json) {
    jsonLd = lp.schema_json;
  } else {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${event.title} - ${loc.city}`,
      description: pageDescription,
      image: event.image_url ? [event.image_url] : undefined,
      offers: event.price
        ? {
            "@type": "Offer",
            price: String(event.price),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: lp?.canonical_url || `https://www.retreatarcade.in/events/${event.slug}/${loc.slug}`,
          }
        : undefined,
      sku: event.id,
    };
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-24">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 h-[50vh] sm:h-[60vh] lg:h-[70vh] relative">
          <Image src={featuredImage} alt={event.title} fill className="object-contain w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          <div className="absolute left-6 bottom-6 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {pageTitle}
            </h1>
            {pageDescription && <p className="mt-2 text-sm text-white/80 max-w-xl">{pageDescription}</p>}
            <div className="mt-3 flex gap-3">
              <Link href={`/events/${event.slug}`} className="text-sm text-white/90 bg-white/10 px-3 py-2 rounded">
                View Event
              </Link>
              <a href={`tel:+919063679687`} className="text-sm bg-amber-500 text-white px-3 py-2 rounded">
                Call to Inquire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">
        <aside className="order-1 lg:order-2">
          <div className="bg-white p-6 rounded-2xl shadow border sticky top-32 space-y-6">
            {event.price && (
              <div className="p-4 rounded-xl border flex items-center">
                <span className="text-2xl font-bold mr-3">₹</span>
                <div>
                  <p className="text-sm text-gray-500">Starting From</p>
                  <p className="text-lg font-bold">₹{Number(event.price).toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            <a href="tel:+919063679687" className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg">
              Call to Inquire
            </a>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Category</h4>
              <p className="text-gray-600">{event.category || "Photobooth"}</p>
            </div>

            {/* quick link to canonical */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Canonical URL</h4>
              <p className="text-xs text-gray-500">{lp?.canonical_url || `https://www.retreatarcade.in/events/${event.slug}/${loc.slug}`}</p>
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
              {/* @ts-ignore - GalleryClient is client-only */}
              <GalleryClient images={galleryImages} />
            </article>
          )}

          <section>
            <h3 className="text-3xl font-bold mb-6">More from Retreat Arcade</h3>
            <p className="text-gray-700">Explore our other photobooth options and event games — available across multiple cities.</p>
            <div className="mt-6">
              <Link href="/services/photobooth-rentals" className="text-amber-600 underline">
                View all photobooth services
              </Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
