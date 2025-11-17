import { supabase } from "@/lib/supabase";
import ProductPage from "@/components/ProductPage"; // your existing component

export default async function LocationSpecificPage({ params }) {
  const { productSlug, locationSlug } = params;

  // Fetch product details using productSlug
  const { data: product } = await supabase
    .from("events")
    .select("*")
    .eq("slug", productSlug)
    .single();

  // Fetch city metadata (SEO title/desc from location_pages table)
  const { data: lp } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_id", product?.id)
    .eq("location_id", supabase.rpc("get_location_id_from_slug", { slug: locationSlug }))
    .maybeSingle();

  return (
    <ProductPage
      product={product}
      citySEO={lp}   // updated meta content
    />
  );
}
