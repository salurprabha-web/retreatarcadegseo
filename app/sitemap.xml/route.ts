// app/sitemap.xml/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = "https://www.retreatarcade.in";

  // ---------------------------
  // Fetch main content
  // ---------------------------
  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  const { data: services } = await supabase
    .from("services")
    .select("slug, updated_at")
    .eq("status", "published");

  const { data: locations } = await supabase
    .from("locations")
    .select("slug, updated_at")
    .eq("is_active", true);

  const { data: locationPages } = await supabase
    .from("location_pages")
    .select(`
      slug,
      product_type,
      events (slug),
      services (slug),
      locations (slug)
    `);

  // ---------------------------
  // STATIC ROUTES
  // ---------------------------
  const staticUrls = [
    "",
    "/about",
    "/contact",
    "/events",
    "/services",
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  staticUrls.forEach((path) => {
    xml += `
<url>
  <loc>${baseUrl}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`;
  });

  // ---------------------------
  // EVENTS
  // ---------------------------
  events?.forEach((item) => {
    xml += `
<url>
  <loc>${baseUrl}/events/${item.slug}</loc>
  <lastmod>${new Date(item.updated_at).toISOString()}</lastmod>
  <priority>0.9</priority>
</url>`;
  });

  // ---------------------------
  // SERVICES
  // ---------------------------
  services?.forEach((item) => {
    xml += `
<url>
  <loc>${baseUrl}/services/${item.slug}</loc>
  <lastmod>${new Date(item.updated_at).toISOString()}</lastmod>
  <priority>0.9</priority>
</url>`;
  });

  // ---------------------------
  // LOCATION PAGES
  // ---------------------------
  locationPages?.forEach((lp) => {
    const locationSlug = lp.locations?.slug;

    let productSlug =
      lp.product_type === "event"
        ? lp.events?.slug
        : lp.services?.slug;

    xml += `
<url>
  <loc>${baseUrl}/${lp.product_type}s/${productSlug}/${locationSlug}</loc>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>`;
  });

  xml += "</urlset>";

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
