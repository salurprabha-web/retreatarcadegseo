import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string; location: string };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.retreatarcade.in";

/* ---------------------------------------------------------------
   generateMetadata — reads ALL CMS SEO fields from service_location_seo
   (previously only reading meta_title and meta_description — missing
    canonical_url, og_title, og_image, twitter_title, schema_json)
--------------------------------------------------------------- */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, location } = params;

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!service || !loc) {
    return {
      title: "Not Found | Retreat Arcade",
      description: "Requested service or location does not exist.",
    };
  }

  // ✅ FIX: Fetch ALL CMS-controlled SEO fields, not just meta_title/meta_description
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("meta_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .maybeSingle();

  const title = seo?.meta_title || `${service.title} in ${loc.city} | Retreat Arcade`;
  const description =
    seo?.meta_description ||
    `Book ${service.title} in ${loc.city} with Retreat Arcade. Interactive games, photo booths & event entertainment.`;

  // ✅ CMS canonical takes priority; fall back to computed URL
  const canonical = seo?.canonical_url || `${siteUrl}/services/${slug}/${location}`;
  const ogImage = seo?.og_image || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: canonical,
      siteName: "Retreat Arcade",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitter_title || title,
      description: seo?.twitter_description || description,
      images: [ogImage],
    },
  };
}

/* ---------------------------------------------------------------
   Page Component — also reads schema_json from CMS
--------------------------------------------------------------- */
export default async function ServiceLocationPage({ params }: PageProps) {
  const { slug, location } = params;

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (!service)
    return <div className="p-10 text-center text-xl">Service not found</div>;

  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!loc)
    return <div className="p-10 text-center text-xl">Location not found</div>;

  // ✅ FIX: Also fetch schema_json from CMS for this service+location combo
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("schema_json, canonical_url")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .maybeSingle();

  const canonical = seo?.canonical_url || `${siteUrl}/services/${slug}/${location}`;

  // ✅ Use CMS schema_json if set; otherwise auto-generate a sensible default
  const schemaJson = (seo?.schema_json && Object.keys(seo.schema_json).length > 0)
    ? seo.schema_json
    : {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${service.title} in ${loc.city}`,
        description: `${service.title} available in ${loc.city}, Hyderabad with Retreat Arcade.`,
        url: canonical,
        areaServed: { "@type": "City", name: loc.city },
        provider: {
          "@type": "LocalBusiness",
          name: "Retreat Arcade",
          url: siteUrl,
        },
      };

  // Assigned product IDs
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((x: any) => x.product_id) || [];

  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-6xl mx-auto p-6 pt-28">
      {/* ✅ CMS schema_json rendered on page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <h1 className="text-4xl font-bold mb-4 text-gray-900">
        {service.title} in {loc.city}
      </h1>
      <p className="text-gray-600 text-lg mb-8">
        Explore premium event experiences available in {loc.city}.
      </p>

      <ProductList
        products={products || []}
        locationName={loc.city}
        locationSlug={location}
        serviceSlug={slug}
      />
    </div>
  );
}
