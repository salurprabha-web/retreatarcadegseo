import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string; location: string };
}

/* ----------------------------------------------------
   ⭐ 1. SEO - generateMetadata()
---------------------------------------------------- */
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
      title: "Not Found | Retreat Arcade",
      description: "Requested service or location does not exist.",
    };
  }

  // Fetch SEO overrides
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("meta_title, meta_description")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .maybeSingle();

  return {
    title: seo?.meta_title || `${service.title} in ${loc.city}`,
    description:
      seo?.meta_description ||
      `Book ${service.title} services in ${loc.city} with Retreat Arcade.`,
  };
}

/* ----------------------------------------------------
   ⭐ 2. Actual Page
---------------------------------------------------- */
export default async function ServiceLocationPage({ params }: PageProps) {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (!service)
    return <div className="p-10 text-center text-xl">Service not found</div>;

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city")
    .eq("slug", location)
    .single();

  if (!loc)
    return <div className="p-10 text-center text-xl">Location not found</div>;

  // Assigned product IDs
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((x) => x.product_id) || [];

  // Products
  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-6xl mx-auto p-6 pt-28">
      <h1 className="text-4xl font-bold mb-4 text-gray-900">
        {service.title} in {loc.city}
      </h1>

      <p className="text-gray-600 text-lg mb-8">
        Explore premium event experiences available in {loc.city}.
      </p>

      <ProductList products={products || []} locationName={loc.city} />
    </div>
  );
}
