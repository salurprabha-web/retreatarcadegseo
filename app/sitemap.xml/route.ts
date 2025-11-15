import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const baseUrl = "https://www.retreatarcade.in";

  // -------------------------------
  // 1️⃣ STATIC ROUTES
  // -------------------------------
  const staticUrls = ["", "/about", "/contact", "/events", "/services"];

  // -------------------------------
  // 2️⃣ FETCH EVENTS
  // -------------------------------
  const { data: events } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  // -------------------------------
  // 3️⃣ FETCH LOCATION PAGES
  // -------------------------------
  const { data: locationPages } = await supabase
    .from("location_pages")
    .select(`
      id,
      product_type,
      slug,
      created_at,
      locations ( slug ),
      events ( slug ),
      services ( slug )
    `);

  // -------------------------------
  // 4️⃣ START XML
  // -------------------------------
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // -------------------------------
  // 5️⃣ ADD STATIC PAGES
  // -------------------------------
  staticUrls.forEach((path) => {
    xml += `
<url>
  <loc>${baseUrl}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
  });

  // -------------------------------
  // 6️⃣ EVENT PAGES
  // -------------------------------
  events?.forEach((event) => {
    if (!event.slug) return;

    xml += `
<url>
  <loc>${baseUrl}/events/${event.slug}</loc>
  <lastmod>${new Date(event.updated_at || new Date()).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>`;
  });

  // -------------------------------
  // 7️⃣ LOCATION-SPECIFIC PAGES
  // -------------------------------
  locationPages?.forEach((lp) => {
    // Safe extraction (fixes NEXT error)
    const locationSlug = Array.isArray(lp.locations)
      ? lp.locations[0]?.slug
      : lp.locations?.slug;

    const eventSlug = Array.isArray(lp.events)
      ? lp.events[0]?.slug
      : lp.events?.slug;

    const serviceSlug = Array.isArray(lp.services)
      ? lp.services[0]?.slug
      : lp.services?.slug;

    // Determine final product slug
    const productSlug =
      lp.product_type === "event"
        ? eventSlug
        : lp.product_type === "service"
        ? serviceSlug
        : null;

    if (!locationSlug || !productSlug) return;

    const section = lp.product_type === "event" ? "events" : "services";
    const fullUrl = `${baseUrl}/${section}/${productSlug}/${locationSlug}`;

    xml += `
<url>
  <loc>${fullUrl}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
  });

  // -------------------------------
  // END XML
  // -------------------------------
  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
