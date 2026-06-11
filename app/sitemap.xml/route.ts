// sitemap.xml/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = "https://www.retreatarcade.in";

function getFirst<T>(value: T | T[] | null | undefined): T | null {
if (!value) return null;
return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET() {
try {
// ----------------------------------
// Static Routes
// ----------------------------------
const staticRoutes = [
"",
"/about",
"/contact",
"/events",
"/services",
];

```
// ----------------------------------
// Events
// ----------------------------------
const { data: events } = await supabase
  .from("events")
  .select("slug, updated_at")
  .eq("status", "published");

// ----------------------------------
// Services
// ----------------------------------
const { data: services } = await supabase
  .from("services")
  .select("slug, updated_at")
  .eq("status", "published");

// ----------------------------------
// Location Pages
// ----------------------------------
const { data: locationPages } = await supabase
  .from("location_pages")
  .select(`
    id,
    product_type,
    created_at,
    locations (
      id,
      slug
    ),
    events (
      id,
      slug
    ),
    services (
      id,
      slug
    )
  `);

let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

// ----------------------------------
// Static Pages
// ----------------------------------
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
// ----------------------------------
// Event Pages
// ----------------------------------
events?.forEach((event) => {
  if (!event?.slug) return;

  xml += `
```

<url>
  <loc>${BASE_URL}/events/${event.slug}</loc>
  <lastmod>${new Date(
    event.updated_at || new Date()
  ).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.90</priority>
</url>`;
    });

```
// ----------------------------------
// Service Pages
// ----------------------------------
services?.forEach((service) => {
  if (!service?.slug) return;

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
// ----------------------------------
// Location Pages
// ----------------------------------
locationPages?.forEach((lp: any) => {
  const location = getFirst(lp.locations);
  const event = getFirst(lp.events);
  const service = getFirst(lp.services);

  const locationSlug = location?.slug;
  const eventSlug = event?.slug;
  const serviceSlug = service?.slug;

  if (!locationSlug) return;

  if (
    lp.product_type === "event" &&
    eventSlug
  ) {
    xml += `
```

<url>
  <loc>${BASE_URL}/events/${eventSlug}/${locationSlug}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
      }

```
  if (
    lp.product_type === "service" &&
    serviceSlug
  ) {
    xml += `
```

<url>
  <loc>${BASE_URL}/services/${serviceSlug}/${locationSlug}</loc>
  <changefreq>weekly</changefreq>
  <priority>0.85</priority>
</url>`;
      }
    });

```
xml += `</urlset>`;

return new NextResponse(xml, {
  headers: {
    "Content-Type": "application/xml",
  },
});
```

} catch (error) {
return new NextResponse(
`Sitemap generation failed: ${String(error)}`,
{ status: 500 }
);
}
}
