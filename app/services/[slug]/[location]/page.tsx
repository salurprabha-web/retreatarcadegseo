import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

interface Props {
  params: { slug: string; location: string };
}

export const dynamic = "force-dynamic";

// ⭐ Proper SEO for Next.js App Router
export async function generateMetadata({ params }: Props) {
  const { slug, location } = params;

  const { data: service } = await supabase
    .from("services")
    .select("title")
    .eq("slug", slug)
    .single();

  const { data: loc } = await supabase
    .from("locations")
    .select("city")
    .eq("slug", location)
    .single();

  if (!service || !loc)
    return {
      title: "Not found | Retreat Arcade",
      description: "This location-specific service page does not exist.",
    };

  return {
    title: `${service.title} in ${loc.city} | Retreat Arcade`,
    description: `Book ${service.title} services in ${loc.city} at Retreat Arcade.`,
  };
}

export default async function ServiceLocationPage({ params }: Props) {
  const { slug, location } = params;

  // 1️⃣ Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) {
    return <div className="p-10">Service not found</div>;
  }

  // 2️⃣ Fetch location (slug or city)
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .or(`slug.eq.${location},city.ilike.${location}`)
    .single();

  if (!loc) {
    return <div className="p-10">Location not found</div>;
  }

  // 3️⃣ SEO table
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  // 4️⃣ Assigned products
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((x) => x.product_id) || [];

  // 5️⃣ Products
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
