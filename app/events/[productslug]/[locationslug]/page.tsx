import { supabase } from "@/lib/supabase";
import ProductPage from "@/components/ProductPage"; // your existing product page
import { notFound } from "next/navigation";

export default async function LocationPage({ params }) {
  const { productSlug, locationSlug } = params;

  // Fetch the master product
  const { data: product } = await supabase
    .from("events")
    .select("*")
    .eq("slug", productSlug)
    .single();

  if (!product) return notFound();

  // Fetch location id
  const { data: loc } = await supabase
    .from("locations")
    .select("id, city, slug, name")
    .eq("slug", locationSlug)
    .maybeSingle();

  // Load SEO overrides from location_pages table
  const { data: citySEO } = await supabase
    .from("location_pages")
    .select("*")
    .eq("product_id", product.id)
    .eq("location_id", loc?.id || "")
    .maybeSingle();

  // Render same product page but with SEO override
  return (
    <ProductPage
      product={product}
      citySEO={citySEO}  // this contains meta title + description
      city={loc}
    />
  );
}
