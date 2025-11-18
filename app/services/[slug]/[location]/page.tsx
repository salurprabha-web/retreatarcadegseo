import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

interface Props {
  params: {
    slug: string;
    location: string;
  };
}

export const dynamic = "force-dynamic";

/* -------------------------------------------------------
   🔥 SEO METADATA (Correct Next.js App Router Method)
--------------------------------------------------------*/
export async function generateMetadata({ params }: Props) {
  const { slug, location } = params;

  // 1️⃣ Fetch the service
  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  // 2️⃣ Fetch the location (your table uses "city")
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!service || !loc) {
    return { title: "Page Not Found | Retreat Arcade" };
  }

  // 3️⃣ Fetch SEO for this specific service + location
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  return {
    title: seo?.meta_title ?? `${service.title} in ${loc.city} | Retreat Arcade`,
    description:
      seo?.meta_description ??
      `Book ${service.title} services in ${loc.city}. Best pricing & packages.`,
    keywords: seo?.meta_keywords?.join(", ") ?? "",

    // Inject JSON-LD Schema
    other: {
      "script:ld+json": seo?.json_schema
        ? JSON.stringify(seo.json_schema)
        : undefined,
    },
  };
}

/* -------------------------------------------------------
   🔥 PAGE CONTENT
--------------------------------------------------------*/
export default async function ServiceLocationPage({ params }: Props) {
  const { slug, location } = params;

  /* 1️⃣ Fetch service */
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) {
    return <div className="p-10 text-center">Service not found</div>;
  }

  /* 2️⃣ Fetch location */
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!loc) {
    return <div className="p-10 text-center">Location not found</div>;
  }

  /* 3️⃣ Load assigned product IDs */
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((p) => p.product_id) ?? [];

  /* 4️⃣ Load product details */
  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-3">
        {service.title} in {loc.city}
      </h1>

      <p className="text-gray-600 mb-6">
        Explore all available packages for this service in {loc.city}.
      </p>

      <ProductList products={products || []} locationName={loc.city} />
    </div>
  );
}
