// app/services/[slug]/[location]/page.tsx
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* -----------------------------------------------------
   1️⃣ SEO METADATA
----------------------------------------------------- */
export async function generateMetadata({
  params,
}: {
  params: { slug: string; location: string };
}): Promise<Metadata> {
  const { slug, location } = params;

  // Load service
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug, image_url, summary, description")
    .eq("slug", slug)
    .single();

  if (!service) {
    return {
      title: "Service Not Found | Retreat Arcade",
      description: "The service you are looking for could not be found.",
    };
  }

  // Load location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!loc) {
    return {
      title: "Location Not Found | Retreat Arcade",
      description: "The location you are looking for could not be found.",
    };
  }

  // Load SEO overrides
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  const metaTitle =
    seo?.meta_title || `${service.title} in ${loc.city} | Retreat Arcade`;

  const metaDescription =
    seo?.meta_description ||
    `Book ${service.title} services in ${loc.city} at the best price.`;

  const imageUrl = service.image_url || "/default-image.jpg";
  const pageUrl = `https://www.retreatarcade.in/services/${slug}/${location}`;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
      url: pageUrl,
      siteName: "Retreat Arcade",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
  };
}

/* -----------------------------------------------------
   2️⃣ PAGE CONTENT
----------------------------------------------------- */
export default async function ServiceLocationPage({
  params,
}: {
  params: { slug: string; location: string };
}) {
  const { slug, location } = params;

  /* ----- Load service ----- */
  const { data: service } = await supabase
    .from("services")
    .select(
      "id, title, slug, summary, description, image_url, related_event_ids"
    )
    .eq("slug", slug)
    .single();

  if (!service) return notFound();

  /* ----- Load location ----- */
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!loc) return notFound();

  /* ----- Load assigned products ----- */
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((p) => p.product_id) || [];

  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  /* ----- Load SEO overrides ----- */
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  /* ----- JSON–LD ----- */
  const jsonLd = seo?.json_schema || {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} in ${loc.city}`,
    description: service.summary || service.description,
    provider: {
      "@type": "Organization",
      name: "Retreat Arcade",
      url: "https://www.retreatarcade.in",
    },
  };

  return (
    <div className="bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------- */}
      {/* HERO SECTION                                */}
      {/* ------------------------------------------- */}
      <section className="relative h-[520px] flex items-center justify-center text-center text-white overflow-hidden pt-28 md:pt-0">
        <Image
          src={service.image_url || "/default-image.jpg"}
          alt={service.title}
          fill
          className="object-cover object-top"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/70" />

        <div className="relative z-10 px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl">
            {service.title} in {loc.city}
          </h1>

          {service.summary && (
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 drop-shadow-lg">
              {service.summary}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------- */}
      {/* PRODUCTS LIST                                */}
      {/* ------------------------------------------- */}
      <ProductList products={products || []} locationName={loc.city} />

      {/* ------------------------------------------- */}
      {/* DESCRIPTION SECTION                           */}
      {/* ------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className="text-gray-800 leading-relaxed text-lg
          [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: service.description }}
        />
      </section>
    </div>
  );
}
