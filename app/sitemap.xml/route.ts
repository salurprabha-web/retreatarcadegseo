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
    { path: "",          priority: "1.00", freq: "daily"   },
    { path: "/about",    priority: "0.70", freq: "monthly" },
    { path: "/contact",  priority: "0.80", freq: "monthly" },
    { path: "/events",   priority: "0.85", freq: "daily"   },
    { path: "/services", priority: "0.90", freq: "weekly"  },
    { path: "/blog",     priority: "0.80", freq: "daily"   },   // ✅ added
    { path: "/gallery",  priority: "0.65", freq: "weekly"  },   // ✅ added
  ];

  const [
    { data: events },
    { data: services },
    { data: blogPosts },           // ✅ added
    { data: serviceLocationSeo },
    { data: serviceLocationProducts },
  ] = await Promise.all([
    supabase.from("events").select("slug, updated_at").eq("status", "published"),
    supabase.from("services").select("slug, updated_at").eq("status", "published"),
    supabase                                                      // ✅ added
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published"),
    supabase.from("service_location_seo").select(`
      updated_at,
      services!inner(slug,status),
      locations!inner(slug,is_active)
    `),
    supabase
      .from("service_location_products")
      .select(`
        updated_at,
        is_enabled,
        services!fk_service(slug,status),
        locations!fk_location(slug,is_active),
        events!fk_product(slug,status)
      `)
      .eq("is_enabled", true),
  ]);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // ── Static pages ──────────────────────────────────────────────
  staticRoutes.forEach(({ path, priority, freq }) => {
    xml += `
<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>${freq}</changefreq>
  <priority>${priority}</priority>
</url>`;
  });

  // ── Blog posts ────────────────────────────────────────────────
  blogPosts?.forEach((post: any) => {
    if (!post?.slug) return;
    const lastmod = post.updated_at || post.published_at || new Date().toISOString();
    xml += `
<url>
  <loc>${BASE_URL}/blog/${post.slug}</loc>
  <lastmod>${new Date(lastmod).toISOString()}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.75</priority>
</url>`;
  });

  // ── Event / product pages ─────────────────────────────────────
  events?.forEach((event: any) => {
    if (!event?.slug) return;
    xml += `
<url>
  <loc>${BASE_URL}/events/${event.slug}</loc>
  <lastmod>${new Date(event.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // ── Service pillar pages ──────────────────────────────────────
  services?.forEach((service: any) => {
    if (!service?.slug) return;
    xml += `
<url>
  <loc>${BASE_URL}/services/${service.slug}</loc>
  <lastmod>${new Date(service.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // ── Service + Location pages ──────────────────────────────────
  serviceLocationSeo?.forEach((item: any) => {
    const serviceSlug  = item.services?.slug;
    const locationSlug = item.locations?.slug;
    if (!serviceSlug || !locationSlug) return;
    if (item.services?.status !== "published") return;
    if (!item.locations?.is_active) return;
    xml += `
<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}</loc>
  <lastmod>${new Date(item.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  // ── Service + Location + Product pages ───────────────────────
  serviceLocationProducts?.forEach((item: any) => {
    const serviceSlug  = item.services?.slug;
    const productSlug  = item.events?.slug;
    const locationSlug = item.locations?.slug;
    if (!serviceSlug || !productSlug || !locationSlug) return;
    if (item.services?.status !== "published") return;
    if (item.events?.status   !== "published") return;
    if (!item.locations?.is_active) return;
    xml += `
<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}/${productSlug}</loc>
  <lastmod>${new Date(item.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.95</priority>
</url>`;
  });

  xml += `</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
