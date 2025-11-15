import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// SAFE SUPABASE CLIENT
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------------------
// TEMP SAFE FALLBACK — this prevents build failure
// Replace with your real sitemap regeneration later.
// ----------------------------------------------------
async function regenerateSitemap() {
  console.log("Sitemap regeneration placeholder executed.");
  return true;
}

// ----------------------------------------------------
// JSON-LD BUILDER
// ----------------------------------------------------
function buildSchema(lp: any, product: any, location: any) {
  const base = {
    "@context": "https://schema.org",
    "@type": lp.product_type === "event" ? "Event" : "Service",
    name: lp.title,
    description: lp.seo_description || product?.description || "",
    areaServed: location?.name || "",
    url: lp.canonical_url,
  };

  if (lp.product_type === "event") {
    return {
      ...base,
      eventStatus: "EventScheduled",
      eventAttendanceMode: "OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: location?.name,
        address: location?.name,
      },
    };
  }

  return base;
}

// ======================================================
// GET — Fetch ALL location pages
// ======================================================
export async function GET() {
  const { data, error } = await supabase
    .from("location_pages")
    .select(`
      *,
      locations ( id, name, slug ),
      events ( id, slug, title ),
      services ( id, slug, title )
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ======================================================
// POST — Create new Location Page
// ======================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, location_id, title, seo_title, seo_description } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json(
        { error: "product_id, location_id, title required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Detect product type
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    // Fetch related location
    const { data: location } = await supabase
      .from("locations")
      .select("name, slug")
      .eq("id", location_id)
      .maybeSingle();

    if (!location?.slug) {
      return NextResponse.json(
        { error: "Location slug not found" },
        { status: 400 }
      );
    }

    // Fetch product (event or service)
    const productTable = product_type === "event" ? "events" : "services";

    const { data: product } = await supabase
      .from(productTable)
      .select("slug, title, description")
      .eq("id", product_id)
      .maybeSingle();

    if (!product?.slug) {
      return NextResponse.json(
        { error: "Product slug not found" },
        { status: 400 }
      );
    }

    // Safe canonical URL
    const canonical_url = `https://www.retreatarcade.in/${
      product_type === "event" ? "events" : "services"
    }/${product.slug}/${location.slug}`;

    // Build JSON-LD schema
    const schema_json = buildSchema(
      { title, seo_description, product_type, canonical_url },
      product,
      location
    );

    // Insert new row
    const { data, error } = await supabase
      .from("location_pages")
      .insert({
        product_id,
        location_id,
        product_type,
        title,
        slug,
        seo_title,
        seo_description,
        canonical_url,
        schema_json,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await regenerateSitemap();

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ======================================================
// PUT — Update Location Page
// ======================================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, seo_title, seo_description } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Fetch existing LP
    const { data: lp } = await supabase
      .from("location_pages")
      .select(
        `
        *,
        locations ( name, slug ),
        events ( slug, description ),
        services ( slug, description )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (!lp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const product =
      lp.product_type === "event" ? lp.events : lp.services;

    const location = lp.locations;

    if (!product?.slug || !location?.slug) {
      return NextResponse.json(
        { error: "Missing product/location slug" },
        { status: 400 }
      );
    }

    const canonical_url = `https://www.retreatarcade.in/${
      lp.product_type === "event" ? "events" : "services"
    }/${product.slug}/${location.slug}`;

    const schema_json = buildSchema(
      { ...lp, title, seo_description, canonical_url },
      product,
      location
    );

    const { data: updated, error } = await supabase
      .from("location_pages")
      .update({
        title,
        seo_title,
        seo_description,
        canonical_url,
        schema_json,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await regenerateSitemap();

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ======================================================
// DELETE
// ======================================================
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("location_pages")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await regenerateSitemap();

  return NextResponse.json({ success: true });
}
