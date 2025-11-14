import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = "https://www.retreatarcade.in";

  // STATIC ROUTES
  const staticUrls = ["", "/about", "/contact", "/events", "/services"];

  // FETCH events
  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  // FETCH location pages
  const { data: locationPages } = await supabase
    .from("location_pages")
    .select(`
      id,
      slug,
      product_type,
      created_at,
      locations ( slug ),
      events ( slug ),
      services ( slug )
    `);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  staticUrls.forEach((path) => {
    xml += `
<url>
  <loc>${baseUrl}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`;
  });

  // Add all events
  events?.forEach((event) => {
    xml += `
<url>
  <loc>${baseUrl}/events/${event.slug}</loc>
  <lastmod>${new Date(event.updated_at).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>`;
  });

  // Add all location-specific pages
  locationPages?.forEach((lp) => {
    const locationSlug = lp.locations?.[0]?.slug || "";
    const productSlug =
      lp.product_type === "event"
        ? lp.events?.[0]?.slug || ""
        : lp.services?.[0]?.slug || "";

    if (!locationSlug || !productSlug) return;

    xml += `
<url>
  <loc>${baseUrl}/${lp.product_type === "event" ? "events" : "services"}/${productSlug}/${locationSlug}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
