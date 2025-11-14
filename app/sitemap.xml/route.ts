import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = "https://www.retreatarcade.in";

  // ========= Fetch Services ========
  const { data: services } = await supabase
    .from("services")
    .select("slug, updated_at")
    .eq("status", "published");

  // ========= Fetch Events ==========
  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  // ========= Fetch Location Pages =========
  const { data: locationPages } = await supabase
    .from("location_pages")
    .select("slug, product_type, updated_at")
    .eq("is_active", true);

  // ========= Static URLs ==========
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

  // Add static pages
  staticUrls.forEach((path) => {
    xml += `
<url>
  <loc>${baseUrl}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
  });

  // Add services
  services?.forEach((s) => {
    xml += `
<url>
  <loc>${baseUrl}/services/${s.slug}</loc>
  <lastmod>${new Date(s.updated_at).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // Add events
  events?.forEach((e) => {
    xml += `
<url>
  <loc>${baseUrl}/events/${e.slug}</loc>
  <lastmod>${new Date(e.updated_at).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // Add location pages (BOTH service + event)
  locationPages?.forEach((p) => {
    const prefix = p.product_type === "service" ? "services" : "events";

    xml += `
<url>
  <loc>${baseUrl}/${prefix}/${p.slug}</loc>
  <lastmod>${new Date(p.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.95</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
