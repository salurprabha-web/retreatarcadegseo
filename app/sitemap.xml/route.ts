// app/sitemap.xml/route.ts
import { createClient } from "@supabase/supabase-js";
export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const baseUrl = "https://www.retreatarcade.in";

  // static
  const staticUrls = ["", "/about", "/contact", "/events", "/services"];

  // events + services
  const [{ data: events }, { data: services }, { data: location_pages }] = await Promise.all([
    supabase.from("events").select("slug, updated_at").eq("status","published"),
    supabase.from("services").select("slug, updated_at").eq("status","published"),
    supabase.from("location_pages").select("product_type, slug, updated_at"),
  ]);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  staticUrls.forEach((path) => {
    xml += `
    <url>
      <loc>${baseUrl}${path}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  (events || []).forEach((e: any) => {
    xml += `
    <url>
      <loc>${baseUrl}/events/${e.slug}</loc>
      <lastmod>${new Date(e.updated_at).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`;
  });

  (services || []).forEach((s: any) => {
    xml += `
    <url>
      <loc>${baseUrl}/services/${s.slug}</loc>
      <lastmod>${new Date(s.updated_at).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`;
  });

  // location_pages (already location-specific slugs)
  (location_pages || []).forEach((p: any) => {
    // schema: product_type + slug - we need to build URL: /events/<slug>/<location> or /services/<slug>/<location>
    // But location_pages slug is overall slug — ensure it contains product slug + location slug if you store both pieces.
    // Best: if your table stores slug (page slug) and we didn't store location slug here, fallback skip.
    const locUrl = `${baseUrl}/${p.product_type === "event" ? "events" : "services"}/${p.slug}`;
    xml += `
    <url>
      <loc>${locUrl}</loc>
      <lastmod>${new Date(p.updated_at || new Date()).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
