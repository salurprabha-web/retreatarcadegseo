import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ProductListClient from "./product-list-client";

interface Props {
  params: { slug: string; location: string };
}

export const revalidate = 0;
export const dynamic = "force-dynamic";

/* -----------------------------------------------
   SEO: generateMetadata
------------------------------------------------ */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!service || !loc) {
    return {
      title: "Not found | Retreat Arcade",
      description: "This location-specific service page does not exist.",
    };
  }

  // Fetch SEO row
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  const title =
    seo?.meta_title ||
    `${service.title} in ${loc.city} | Retreat Arcade`;

  const description =
    seo?.meta_description ||
    `Discover ${service.title} services available in ${loc.city}.`;

  const pageUrl = `https://www.retreatarcade.in/services/${slug}/${location}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "Retreat Arcade",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* -----------------------------------------------
   PAGE COMPONENT
------------------------------------------------ */
export default async function ServiceLocationPage({ params }: Props) {
  const { slug, location } = params;

  // Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) return <div className="p-10">Service not found</div>;

  // Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
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

  const productIds = assigned?.map((p: any) => p.product_id) ?? [];

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("id, title, slug, price, image_url")
      .in("id", productIds);
    products = data || [];
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">
        {service.title} in {loc.city}
      </h1>

      <p className="text-gray-600 mb-10">
        Explore all available services in this location.
      </p>

      <ProductListClient products={products} locationName={loc.city} />
    </div>
  );
}
