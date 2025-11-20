import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string; location: string };
}

// ⭐ 1. Generate Metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!service || !loc) {
    return {
      title: "Not found | Retreat Arcade",
      description: "This location-specific service page does not exist."
    };
  }

  // Fetch SEO
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("meta_title, meta_description")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  return {
    title: seo?.meta_title || `${service.title} in ${loc.city}`,
    description:
      seo?.meta_description ||
      `Book ${service.title} services in ${loc.city} at Retreat Arcade.`
  };
}

// ⭐ 2. Actual Page
export default async function ServiceLocationPage({ params }: PageProps) {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (!service) return <div className="p-10">Service not found</div>;

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!loc) return <div className="p-10">Location not found</div>;

  // Fetch assigned products
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((x) => x.product_id) || [];

  // Fetch real product details
  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-3">
        {service.title} in {loc.city}
      </h1>

      <ProductList products={products || []} locationName={loc.city} />
    </div>
  );
}
