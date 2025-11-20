import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ServiceLocationPage({
  params,
}: {
  params: { slug: string; location: string };
}) {
  const { slug, location } = params;

  console.log("DEBUG: ServiceLocationPage params:", params);

  /* -----------------------------------------------
     1️⃣ Fetch service
  -------------------------------------------------*/
  const { data: service, error: serviceErr } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .maybeSingle();

  console.log("DEBUG: Service result:", service, serviceErr);

  if (!service) {
    return <div className="p-10">Service not found</div>;
  }

  /* -----------------------------------------------
     2️⃣ Fetch location (case-insensitive)
  -------------------------------------------------*/
  const { data: locBySlug } = await supabase
    .from("locations")
    .select("*")
    .ilike("slug", location)
    .maybeSingle();

  const { data: locByCity } = await supabase
    .from("locations")
    .select("*")
    .ilike("city", location)
    .maybeSingle();

  const loc = locBySlug || locByCity;

  console.log("DEBUG: Location result:", {
    locBySlug,
    locByCity,
    final: loc,
  });

  if (!loc) {
    return <div className="p-10">Location not found</div>;
  }

  /* -----------------------------------------------
     3️⃣ Fetch SEO metadata
  -------------------------------------------------*/
  const { data: seo } = await supabase
    .from("service_location_seo")
    .select("*")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .maybeSingle();

  console.log("DEBUG: SEO result:", seo);

  /* -----------------------------------------------
     4️⃣ Fetch assigned products
  -------------------------------------------------*/
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", service.id)
    .eq("location_id", loc.id)
    .eq("is_enabled", true);

  console.log("DEBUG: Assigned products:", assigned);

  const productIds = assigned?.map((p: { product_id: string }) => p.product_id) ?? [];

  let products: any[] = [];

  if (productIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("id, title, slug, price, image_url")
      .in("id", productIds);

    products = data || [];
  }

  console.log("DEBUG: Final products:", products);

  /* -----------------------------------------------
     5️⃣ SEO fallback
  -------------------------------------------------*/
  const metaTitle =
    seo?.meta_title || `${service.title} in ${loc.city} | Retreat Arcade`;

  const metaDescription =
    seo?.meta_description ||
    `Book ${service.title} services in ${loc.city}.`;

  /* -----------------------------------------------
     6️⃣ Render Page
  -------------------------------------------------*/
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
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(seo.json_schema),
            }}
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

        {products.length === 0 ? (
          <p>No products available for this location.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <li key={p.id} className="border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">Slug: {p.slug}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
