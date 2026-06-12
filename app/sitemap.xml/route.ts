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

  // NEW: Service Location SEO Pages
  const { data: serviceLocationSeo } = await supabase
    .from("service_location_seo")
    .select(`
      updated_at,
      services!inner(slug,status),
      locations!inner(slug,is_active)
    `);

  // NEW: Service + Product + Location Pages
  const { data: serviceLocationProducts } = await supabase
    .from("service_location_products")
    .select(`
      updated_at,
      is_enabled,
      services!fk_service(slug,status),
      locations!fk_location(slug,is_active),
      events!fk_product(slug,status)
    `)
    .eq("is_enabled", true);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static Pages
  staticRoutes.forEach((path) => {
    xml += `
<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
  });

  // Event Pages
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

  // Service Pages
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

  // NEW: Service + Location SEO Pages
  serviceLocationSeo?.forEach((item: any) => {
    const serviceSlug = item.services?.slug;
    const locationSlug = item.locations?.slug;

    if (!serviceSlug || !locationSlug) return;
    if (item.services?.status !== "published") return;
    if (!item.locations?.is_active) return;

    xml += `
<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}</loc>
  <lastmod>${new Date(
    item.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  // NEW: Service + Product + Location Pages
  serviceLocationProducts?.forEach((item: any) => {
    const serviceSlug = item.services?.slug;
    const productSlug = item.events?.slug;
    const locationSlug = item.locations?.slug;

    if (!serviceSlug || !productSlug || !locationSlug) return;
    if (item.services?.status !== "published") return;
    if (item.events?.status !== "published") return;
    if (!item.locations?.is_active) return;

    xml += `
<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}/${productSlug}</loc>
  <lastmod>${new Date(
    item.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.95</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
