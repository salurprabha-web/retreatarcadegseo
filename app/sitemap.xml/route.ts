import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  const baseUrl = "https://retreatarcade.in"; // ✅ change to your domain

  const staticUrls = [
    ``,
    `/about`,
    `/contact`,
    `/events`,
    `/services`,
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

  events?.forEach((event) => {
    xml += `
<url>
  <loc>${baseUrl}/events/${event.slug}</loc>
  <lastmod>${new Date(event.updated_at).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
