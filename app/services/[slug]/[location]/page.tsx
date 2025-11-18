import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug, location } = params;

  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  const { data: loc } = await supabase
    .from("locations")
    .select("city, slug, id")
    .eq("slug", location)
    .single();

  if (!service || !loc) {
    return {
      title: "Page Not Found | Retreat Arcade",
      description: "This page does not exist.",
    };
  }

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
    `Book ${service.title} services in ${loc.city}.`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: seo?.meta_keywords || [],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      url: `https://www.retreatarcade.in/services/${slug}/${location}`,
    },
  };
}

export default async function ServiceLocationPage({ params }: any) {
  const { slug, location } = params;

  /* Fetch service */
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) {
    return <div className="p-10 text-center">Service not found</div>;
  }

  /* Fetch location */
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!loc) {
    return <div className="p-10 text-center">Location not found</div>;
  }

  /* Fetch assigned products */
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds = assigned?.map((p: any) => p.product_id) || [];

  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-5xl mx-auto p-6 pt-28">
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
