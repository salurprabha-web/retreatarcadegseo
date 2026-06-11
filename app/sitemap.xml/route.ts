import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://www.retreatarcade.in";

export async function GET() {
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/events",
    "/services",
  ];

  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  const { data: services } = await supabase
    .from("services")
    .select("slug, updated_at")
    .eq("status", "published");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  staticRoutes.forEach((path) => {
    xml += `
<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
  });

  events?.forEach((event: any) => {
    if (!event?.slug) return;

    xml += `
<url>
  <loc>${BASE_URL}/events/${event.slug}</loc>
  <lastmod>${new Date(
    event.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  services?.forEach((service: any) => {
    if (!service?.slug) return;

    xml += `
<url>
  <loc>${BASE_URL}/services/${service.slug}</loc>
  <lastmod>${new Date(
    service.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
