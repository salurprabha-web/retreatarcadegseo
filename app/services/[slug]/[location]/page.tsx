import { createServerClient } from "@/lib/supabase-server";
import ProductList from "./product-list-client";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ServiceLocationPage({ params }: any) {
  const supabase = createServerClient();

  const { slug, location } = params;

  // 1️⃣ Fetch service
  const { data: service } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .single();

  if (!service) return notFound();

  // 2️⃣ Fetch location
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug")
    .eq("slug", location)
    .single();

  if (!loc) return notFound();

  // 3️⃣ Fetch SEO
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .single();

  // 4️⃣ Fetch enabled products
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

  // 5️⃣ SEO tags
  const metaTitle = seo?.meta_title || `${service.title} in ${loc.city} | Retreat Arcade`;
  const metaDescription = seo?.meta_description || `Book ${service.title} in ${loc.city}.`;

  return (
    <>
      <head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        {seo?.meta_keywords && (
          <meta name="keywords" content={seo.meta_keywords.join(", ")} />
        )}

        {seo?.json_schema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.json_schema) }}
          />
        )}
      </head>

      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-3">
          {service.title} in {loc.city}
        </h1>

        <p className="text-gray-600 mb-6">
          Explore all available packages for this service in {loc.city}.
        </p>

        <ProductList products={products || []} locationName={loc.city} />
      </div>
    </>
  );
}
