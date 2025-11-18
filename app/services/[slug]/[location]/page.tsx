import { supabase } from "@/lib/supabase";
import ProductList from "./product-list-client";

interface Props {
  params: {
    slug: string;
    location: string;
  };
}

export const dynamic = "force-dynamic";

/* -----------------------------------------------
   SEO (HEAD TAGS)
-------------------------------------------------*/
export async function generateMetadata({ params }: Props) {
  const { slug, location } = params;

  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  const { data: loc } = await supabase
    .from("locations")
    .select("id, name, slug")
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

  return {
    title:
      seo?.meta_title ??
      `${service.title} in ${loc.name} | Retreat Arcade`,
    description:
      seo?.meta_description ??
      `Book ${service.title} services in ${loc.name}.`,
    keywords: seo?.meta_keywords ?? [],
    other: {
      "script:ld+json": JSON.stringify(seo?.json_schema || {}),
    },
  };
}

/* -----------------------------------------------
   PAGE CONTENT
-------------------------------------------------*/
export default async function ServiceLocationPage({ params }: Props) {
  const { slug, location } = params;

  // SERVICE
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) {
    return <div className="p-10 text-center">Service not found</div>;
  }

  // LOCATION
  const { data: loc } = await supabase
    .from("locations")
    .select("id, name, slug")
    .eq("slug", location)
    .single();

  if (!loc) {
    return <div className="p-10 text-center">Location not found</div>;
  }

  // ASSIGNED PRODUCTS
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  const productIds =
    assigned?.map((p: any) => p.product_id) ?? [];

  // PRODUCT DETAILS
  const { data: products } = await supabase
    .from("events")
    .select("id, title, slug, price, image_url")
    .in("id", productIds);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-3">
        {service.title} in {loc.name}
      </h1>

      <p className="text-gray-600 mb-6">
        Explore all available packages for this service in {loc.name}.
      </p>

      <ProductList
        products={products || []}
        locationName={loc.name}
      />
    </div>
  );
}
