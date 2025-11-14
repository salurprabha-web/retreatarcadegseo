// app/sitemap.xml/route.ts
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  // use PUBLIC anon key (sitemap is public) - ensure envs are set
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = "https://www.retreatarcade.in";

  // fetch published events & services
  const [{ data: events }, { data: services }, { data: locationPages }, { data: locations }] = await Promise.all([
    supabase.from("events").select("id,slug,updated_at").eq("status","published"),
    supabase.from("services").select("id,slug,updated_at").eq("status","published"),
    supabase.from("location_pages").select("id,product_type,product_id,location_id,slug,updated_at"),
    supabase.from("locations").select("id,slug,updated_at")
  ]);

  const staticUrls = [
    ``,
    `/about`,
    `/contact`,
    `/events`,
    `/services`,
    `/gallery`,
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // static
  for (const path of staticUrls) {
    xml += `
  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  // events
  (events || []).forEach((e: any) => {
    xml += `
  <url>
    <loc>${baseUrl}/events/${e.slug}</loc>
    <lastmod>${new Date(e.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  // services
  (services || []).forEach((s: any) => {
    xml += `
  <url>
    <loc>${baseUrl}/services/${s.slug}</loc>
    <lastmod>${new Date(s.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  // location-specific pages (use location_pages entries and map to location slugs)
  const locMap = (locations || []).reduce((acc: any, l: any) => {
    acc[l.id] = l.slug;
    return acc;
  }, {});

  (locationPages || []).forEach((lp: any) => {
    const locationSlug = locMap[lp.location_id];
    if (!locationSlug) return;
    if (lp.product_type === "event") {
      // fetch event slug: we don't have product slug in this row; we will attempt to fetch event row value
      // To keep this efficient we assume product slug exists in events table. We'll build URL using product_id -> but here we can't easily map product_id->slug without extra query.
      // Simpler approach: include locationPages only when location_pages contains product slugs or ensure product slug fetch is available.
    }
  });

  // Instead of relying solely on location_pages table (which might not include product slug),
  // do an explicit join fetch to get location pages with product slug for both events and services.

  const { data: joined } = await supabase.rpc("get_location_pages_with_slugs"); // optional; if not present, fallback

  // Fallback approach if RPC not present: perform two selects and combine.

  if (!joined) {
    // events-location pages
    const { data: evPages } = await supabase
      .from("location_pages")
      .select("id,slug,product_id,location_id,product_type,updated_at")
      .eq("product_type", "event");

    if (evPages) {
      // fetch event slugs for all product_ids in evPages
      const eventIds = evPages.map((p: any) => p.product_id);
      const { data: evs } = await supabase.from("events").select("id,slug,updated_at").in("id", eventIds);
      const evMap = (evs || []).reduce((a: any, e: any) => ((a[e.id] = e.slug), a), {});
      (evPages || []).forEach((p: any) => {
        const eventSlug = evMap[p.product_id];
        const locationSlug = locMap[p.location_id];
        if (eventSlug && locationSlug) {
          xml += `
  <url>
    <loc>${baseUrl}/events/${eventSlug}/${locationSlug}</loc>
    <lastmod>${new Date(p.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }
      });
    }

    // services-location pages
    const { data: svcPages } = await supabase
      .from("location_pages")
      .select("id,slug,product_id,location_id,product_type,updated_at")
      .eq("product_type", "service");

    if (svcPages) {
      const svcIds = svcPages.map((p: any) => p.product_id);
      const { data: svcs } = await supabase.from("services").select("id,slug,updated_at").in("id", svcIds);
      const svcMap = (svcs || []).reduce((a: any, s: any) => ((a[s.id] = s.slug), a), {});
      (svcPages || []).forEach((p: any) => {
        const svcSlug = svcMap[p.product_id];
        const locationSlug = locMap[p.location_id];
        if (svcSlug && locationSlug) {
          xml += `
  <url>
    <loc>${baseUrl}/services/${svcSlug}/${locationSlug}</loc>
    <lastmod>${new Date(p.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }
      });
    }
  } else {
    // if joined RPC provided results with product_slug & location_slug, map them
    (joined || []).forEach((r: any) => {
      xml += `
  <url>
    <loc>${baseUrl}/${r.path}</loc>
    <lastmod>${new Date(r.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
