import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { CITIES } from "@/lib/cities";
import { choosePrimary } from "@/lib/primary-pick";

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
    { path: "/plan-your-event", priority: "0.75", freq: "weekly" },
    { path: "/services", priority: "0.90", freq: "weekly"  },
    { path: "/blog",     priority: "0.80", freq: "daily"   },   // ✅ added
    { path: "/gallery",  priority: "0.65", freq: "weekly"  },   // ✅ added
    { path: "/locations", priority: "0.70", freq: "monthly" },
    ...CITIES.map((c) => ({ path: `/locations/${c.slug}`, priority: c.home ? "0.90" : "0.85", freq: "weekly" })),
  ];

  const [
    { data: events },
    { data: services },
    { data: blogPosts },           // ✅ added
    { data: serviceLocationSeo },
    { data: serviceLocationProducts },
  ] = await Promise.all([
    supabase.from("events").select("slug, updated_at, image_url, title").eq("status", "published"),
    supabase.from("services").select("slug, updated_at, image_url, title, is_tech_service").eq("status", "published"),
    supabase                                                      // ✅ added
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .or("published_at.is.null,published_at.lte." + new Date().toISOString()),
    supabase.from("service_location_seo").select(`
      updated_at,
      status,
      services!inner(slug,status,is_tech_service),
      locations!inner(slug,is_active)
    `),
    supabase
      .from("service_location_products")
      .select(`
        updated_at,
        is_enabled,
        service_id,
        location_id,
        product_id,
        services!fk_service(slug,status,is_tech_service),
        locations!fk_location(slug,is_active),
        events!fk_product(slug,status)
      `)
      .eq("is_enabled", true)
      .range(0, 999),
  ]);

  // PostgREST returns at most 1000 rows per request: read the rest in further pages
  let extraPages: any[] = [];
  if ((serviceLocationProducts?.length || 0) >= 1000) {
    for (let from = 1000; from < 20000; from += 1000) {
      const { data: more } = await supabase
        .from("service_location_products")
        .select(`
          updated_at,
          is_enabled,
          service_id,
          location_id,
          product_id,
          services!fk_service(slug,status,is_tech_service),
          locations!fk_location(slug,is_active),
          events!fk_product(slug,status)
        `)
        .eq("is_enabled", true)
        .range(from, from + 999);
      if (!more?.length) break;
      extraPages = extraPages.concat(more);
      if (more.length < 1000) break;
    }
  }
  const allProducts: any[] = [...(serviceLocationProducts || []), ...extraPages];

  // Index policy: a product in a city is listed ONCE (its primary service). Only pages with their own approved
  // text are listed; drafts and old copy-paste pages stay out, so Google is not sent to duplicates.
  const publishedGen: any[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data: rows } = await supabase
      .from("product_location_pages")
      .select("service_id, location_id, product_id, services(slug, display_order, title, status), events(title, category), locations(city)")
      .eq("status", "published")
      .range(from, from + 999);
    if (!rows?.length) break;
    publishedGen.push(...rows);
    if (rows.length < 1000) break;
  }
  const pairs = new Map<string, any[]>();
  publishedGen.forEach((r: any) => {
    if (r.services?.status !== "published") return;
    const k = `${r.location_id}|${r.product_id}`;
    if (!pairs.has(k)) pairs.set(k, []);
    pairs.get(k)!.push(r);
  });
  const bestByPair = new Map<string, any>();
  pairs.forEach((rows, k) => {
    const pick = choosePrimary(rows.map((r: any) => ({ ...r, slug: r.services.slug, title: r.services.title, display_order: r.services.display_order })), `${rows[0]?.events?.title || ""} ${rows[0]?.events?.category || ""}`, rows[0]?.locations?.city || "");
    if (pick) bestByPair.set(k, pick);
  });
  const primaryKeys = new Set(Array.from(bestByPair.values()).map((r: any) => `${r.service_id}|${r.location_id}|${r.product_id}`));

  // cities added from the admin (their landing page was approved and the city is live)
  const { data: dbCities } = await supabase.from("locations").select("slug, page_status, is_active").eq("page_status", "published").eq("is_active", true);
  (dbCities || []).forEach((c: any) => {
    if (!CITIES.some((h) => h.slug === c.slug)) staticRoutes.push({ path: `/locations/${c.slug}`, priority: "0.85", freq: "weekly" });
  });

  const { data: caseRows } = await supabase.from("case_studies").select("slug, updated_at, published_at").eq("status", "published");
  if (caseRows && caseRows.length) staticRoutes.push({ path: "/our-work", priority: "0.75", freq: "weekly" });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  // ── Static pages ──────────────────────────────────────────────
  staticRoutes.forEach(({ path, priority, freq }) => {
    xml += `
<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>${freq}</changefreq>
  <priority>${priority}</priority>
</url>`;
  });

  // ── Case studies ("Our work") ───────────────────────────────────
  (caseRows || []).forEach((c: any) => {
    if (!c?.slug) return;
    xml += `
<url>
  <loc>${BASE_URL}/our-work/${c.slug}</loc>
  <lastmod>${new Date(c.updated_at || c.published_at || new Date()).toISOString()}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.70</priority>
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
    // ✅ FIX (Semrush: "Incorrect pages found in sitemap.xml" — 13 entries):
    // Technology services (software/website builds, quote-based, no
    // physical delivery location) should never get location-specific
    // URLs like /services/event-registration-software-ticketing/hyderabad
    // — that page doesn't exist and makes no sense for this service type.
    // Likely cause: stale rows in service_location_seo from before the
    // is_tech_service flag existed. Skip them here regardless of any
    // leftover data.
    if (item.services?.is_tech_service) return;
    if (item.status === "draft") return;
    xml += `
<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}</loc>
  <lastmod>${new Date(item.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  // ── Service + Location + Product pages ───────────────────────
  allProducts.forEach((item: any) => {
    if (!primaryKeys.has(`${item.service_id}|${item.location_id}|${item.product_id}`)) return;
    const serviceSlug  = item.services?.slug;
    const productSlug  = item.events?.slug;
    const locationSlug = item.locations?.slug;
    if (!serviceSlug || !productSlug || !locationSlug) return;
    if (item.services?.status !== "published") return;
    if (item.events?.status   !== "published") return;
    if (!item.locations?.is_active) return;
    // ✅ Same exclusion as above — tech services don't get location URLs.
    if (item.services?.is_tech_service) return;
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
