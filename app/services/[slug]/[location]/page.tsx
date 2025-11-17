import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductListClient from "./product-list-client"; // client component

// ======================================================
// 1) PAGE METADATA (SERVER SIDE)
// ======================================================
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!service) {
    return {
      title: "Service Not Found | Retreat Arcade",
      description: "This service is unavailable.",
      robots: "noindex, nofollow",
    };
  }

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", location)
    .eq("status", "published")
    .single();

  if (!loc) {
    return {
      title: `${service.title} | Location Not Found`,
      description: `We don't currently serve this location.`,
      robots: "noindex, nofollow",
    };
  }

  const locationName = loc.city || location;

  const base = "https://www.retreatarcade.in";

  const title =
    service.meta_title_location ||
    `${service.title} in ${locationName} | Retreat Arcade`;

  const description =
    service.meta_desc_location ||
    `Book ${service.title} in ${locationName}. Best event games & photobooth rentals in ${locationName}.`;

  const canonical = `${base}/services/${slug}/${location}`;

  const ogImage = service.image_url || "/default-image.jpg";

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [ogImage],
      siteName: "Retreat Arcade",
      locale: "en_IN",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

// ======================================================
// 2) SERVER PAGE COMPONENT
// ======================================================
export default async function LocationServicePage({
  params,
}: {
  params: { slug: string; location: string };
}) {
  const { slug, location } = params;

  // 1) Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!service) notFound();

  // 2) Fetch location
  const { data: locationData } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", location)
    .eq("status", "published")
    .single();

  if (!locationData) notFound();

  // 3) Fetch mapping (products for this location)
  const { data: link } = await supabase
    .from("location_service_links")
    .select("*, services(*), locations(*)")
    .eq("service_id", service.id)
    .eq("location_id", locationData.id)
    .single();

  const products = link?.products_json || [];

  const locationName =
    location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();

  // Inline ALT text generator
  const generateAlt = (
    title: string,
    location: string,
    type: string = "image"
  ) => `${title} ${type} in ${location} - Retreat Arcade`;

  // ---------------- JSON-LD Schema ----------------
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} in ${locationName}`,
    description: service.summary || service.description,
    image: service.image_url ? [service.image_url] : [],
    areaServed: {
      "@type": "City",
      name: locationName,
    },
    provider: {
      "@type": "Organization",
      name: "Retreat Arcade - Event Games & Photobooth Rentals",
      url: "https://www.retreatarcade.in",
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: service.location_prices?.[location]?.min || "0",
      highPrice: service.location_prices?.[location]?.max || "0",
      priceCurrency: "INR",
      url: `https://www.retreatarcade.in/services/${slug}/${location}`,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Products available in ${locationName}`,
      itemListElement: products.map((p: any) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: `${p.title} in ${locationName}`,
          url: `https://www.retreatarcade.in/services/${p.slug}`,
        },
      })),
    },
  };

  return (
    <div className="bg-white">

      {/* JSON-LD STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------------- Breadcrumbs ---------------- */}
      <nav className="text-sm text-gray-500 p-6">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="hover:text-orange-600">
              Home
            </a>
          </li>
          <span>›</span>

          <li>
            <a href="/services" className="hover:text-orange-600">
              Services
            </a>
          </li>
          <span>›</span>

          <li>
            <a href={`/services/${slug}`} className="hover:text-orange-600">
              {service.title}
            </a>
          </li>
          <span>›</span>

          <li className="text-gray-900 font-semibold">{locationName}</li>
        </ol>
      </nav>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative h-[380px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src={service.image_url || "/default-image.jpg"}
          alt={generateAlt(service.title, locationName)}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {service.title} in {locationName}
          </h1>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg">
            {service.summary}
          </p>
        </div>
      </section>

      {/* ---------------- PRODUCT LIST (CLIENT COMPONENT) ---------------- */}
      <ProductListClient
        products={products}
        locationName={locationName}
      />

      {/* ---------------- DESCRIPTION ---------------- */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div
          className="text-gray-800 leading-relaxed text-lg
          [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>
    </div>
  );
}
