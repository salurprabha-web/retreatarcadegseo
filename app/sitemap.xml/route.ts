import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://www.retreatarcade.in";

export async function GET() {
try {
// -----------------------------
// STATIC ROUTES
// -----------------------------
const staticRoutes = [
"",
"/about",
"/contact",
"/events",
"/services",
];

```
// -----------------------------
// EVENTS
// -----------------------------
const { data: events } = await supabase
  .from("events")
  .select("id, slug, updated_at")
  .eq("status", "published");

// -----------------------------
// SERVICES
// -----------------------------
const { data: services } = await supabase
  .from("services")
  .select("id, slug, updated_at")
  .eq("status", "published");

// -----------------------------
// LOCATIONS
// -----------------------------
const { data: locations } = await supabase
  .from("locations")
  .select("id, slug")
  .eq("is_active", true);

// -----------------------------
// LOCATION PAGES
// -----------------------------
const { data: locationPages } = await supabase
  .from("location_pages")
  .select("*")
  .eq("is_active", true);

let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

// -----------------------------
// STATIC PAGES
// -----------------------------
staticRoutes.forEach((path) => {
  xml += `
```

<url>
  <loc>${BASE_URL}${path}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.80</priority>
</url>`;
    });

```
// -----------------------------
// EVENT PAGES
// -----------------------------
events?.forEach((event) => {
  if (!event.slug) return;

  xml += `
```

<url>
  <loc>${BASE_URL}/events/${event.slug}</loc>
  <lastmod>${new Date(
    event.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>`;
    });

```
// -----------------------------
// SERVICE PAGES
// -----------------------------
services?.forEach((service) => {
  if (!service.slug) return;

  xml += `
```

<url>
  <loc>${BASE_URL}/services/${service.slug}</loc>
  <lastmod>${new Date(
    service.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
    });

```
// -----------------------------
// LOCATION PAGES
// -----------------------------
locationPages?.forEach((lp) => {
  const location = locations?.find(
    (l) => l.id === lp.location_id
  );

  if (!location) return;

  // SERVICE LOCATION PAGE
  if (lp.product_type === "service") {
    const service = services?.find(
      (s) => s.id === lp.product_id
    );

    if (!service) return;

    xml += `
```

<url>
  <loc>${BASE_URL}/services/${service.slug}/${location.slug}</loc>
  <lastmod>${new Date(
    lp.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
      }

```
  // EVENT LOCATION PAGE
  if (lp.product_type === "event") {
    const event = events?.find(
      (e) => e.id === lp.product_id
    );

    if (!event) return;

    xml += `
```

<url>
  <loc>${BASE_URL}/events/${event.slug}/${location.slug}</loc>
  <lastmod>${new Date(
    lp.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
      }
    });

```
xml += `</urlset>`;

return new NextResponse(xml, {
  status: 200,
  headers: {
    "Content-Type": "application/xml",
  },
});
```

} catch (error) {
console.error("Sitemap Error:", error);

```
return new NextResponse(
  JSON.stringify({
    error: "Sitemap generation failed",
    details: String(error),
  }),
  {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  }
);
```

}
}
