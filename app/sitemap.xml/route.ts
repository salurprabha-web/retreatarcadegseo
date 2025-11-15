import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// ---------------------------
// SUPABASE TYPES
// ---------------------------
interface LocationRow {
  id: number;
  name: string | null;
  slug: string | null;
}

interface EventRow {
  id: number;
  slug: string | null;
  title?: string | null;
}

interface ServiceRow {
  id: number;
  slug: string | null;
  title?: string | null;
}

interface LocationPageRow {
  id: number;
  product_type: "event" | "service";
  slug: string | null;
  created_at: string | null;

  locations?: LocationRow | LocationRow[] | null;
  events?: EventRow | EventRow[] | null;
  services?: ServiceRow | ServiceRow[] | null;
}

// ---------------------------
// INIT SUPABASE CLIENT
// ---------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://www.retreatarcade.in";

// ---------------------------
// UTILITY SAFETY EXTRACTORS
// ---------------------------
function safeArrayOrObject<T>(input: T | T[] | null | undefined): T | null {
  if (!input) return null;
  if (Array.isArray(input)) return input[0] || null;
  return input;
}

function safeSlug(item: { slug?: string | null } | null | undefined): string | null {
  return item?.slug || null;
}

// ---------------------------
// MAIN HANDLER
// ---------------------------
export async function GET() {
  // 1️⃣ Static routes
  const staticRoutes = ["", "/about", "/contact", "/events", "/services"];

  // 2️⃣ Fetch events
  const { data: events } = await supabase
    .from<EventRow>("events")
    .select("slug, updated_at")
    .eq("status", "published");

  // 3️⃣ Fetch location pages with relations
  const { data: locationPages } = await supabase
    .from<LocationPageRow>("location_pages")
    .select(`
      id,
      product_type,
      slug,
      created_at,
      locations ( id, name, slug ),
      events ( id, slug ),
      services ( id, slug )
    `);

  // ---------------------------
  // START XML
  // ---------------------------
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // ---------------------------
  // STATIC ROUTE XML
  // ---------------------------
  staticRoutes.forEach((path) => {
    xml += `
<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
  });

  // ---------------------------
  // EVENT PAGES XML
  // ---------------------------
  events?.forEach((event) => {
    if (!event.slug) return;

    xml += `
<url>
  <loc>${BASE_URL}/events/${event.slug}</loc>
  <lastmod>${new Date(event.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // ---------------------------
  // LOCATION PAGES XML
  // ---------------------------
  locationPages?.forEach((lp) => {
    const locationObj = safeArrayOrObject(lp.locations || null);
    const eventObj = safeArrayOrObject(lp.events || null);
    const serviceObj = safeArrayOrObject(lp.services || null);

    const locationSlug = safeSlug(locationObj);
    const eventSlug = safeSlug(eventObj);
    const serviceSlug = safeSlug(serviceObj);

    const productSlug =
      lp.product_type === "event" ? eventSlug :
      lp.product_type === "service" ? serviceSlug :
      null;

    if (!productSlug || !locationSlug) return;

    const section = lp.product_type === "event" ? "events" : "services";

    xml += `
<url>
  <loc>${BASE_URL}/${section}/${productSlug}/${locationSlug}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  // ---------------------------
  // END XML
  // ---------------------------
  xml += `\n</urlset>`;

  
return new NextResponse(xml, {
  status: 200,
  headers: {
    "Content-Type": "application/xml",
  },
});
