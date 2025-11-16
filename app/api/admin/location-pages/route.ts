import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Safe Supabase client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// TEMP — Skip sitemap for now
async function regenerateSitemap() {
  console.log("Sitemap placeholder executed.");
  return true;
}

// Build JSON-LD
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

/* =====================================================
   GET — ALL LOCATION PAGES (FIXED RELATIONS)
   ===================================================== */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("location_pages")
      .select(
        `
          *,
          location:locations!location_pages_location_id_fkey ( id, name, slug ),
          event:events!location_pages_product_id_fkey ( id, slug, title ),
          service:services!location_pages_product_id_fkey ( id, slug, title )
        `
      );

    if (error) {
      console.error("GET /location-pages ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize product field (only one of them exists)
    const normalized = (data || []).map((row: any) => ({
      ...row,
      product: row.event || row.service || null,
      location: row.location,
    }));

    return NextResponse.json({ data: normalized });
  } catch (err: any) {
    console.error("GET /location-pages CATCH:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   POST — CREATE LOCATION PAGE
   ===================================================== */
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

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Detect if product is event or service
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    // Fetch location
    const { data: location } = await supabase
      .from("locations")
      .select("name, slug")
      .eq("id", location_id)
      .maybeSingle();

    if (!location?.slug) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 400 }
      );
    }

    // Fetch product
    const table = product_type === "event" ? "events" : "services";

    const { data: product } = await supabase
      .from(table)
      .select("slug, title, description")
      .eq("id", product_id)
      .maybeSingle();

    if (!product?.slug) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 400 }
      );
    }

    const canonical_url = `https://www.retreatarcade.in/${
      product_type === "event" ? "events" : "services"
    }/${product.slug}/${location.slug}`;

    const schema_json = buildSchema(
      { title, seo_description, product_type, canonical_url },
      product,
      location
    );

    // Insert
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
    console.error("POST /location-pages", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   PUT — UPDATE LOCATION PAGE
   ===================================================== */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, seo_title, seo_description } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { data: lp } = await supabase
      .from("location_pages")
      .select(
        `
        *,
        location:locations!location_pages_location_id_fkey ( name, slug ),
        event:events!location_pages_product_id_fkey ( slug, description ),
        service:services!location_pages_product_id_fkey ( slug, description )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (!lp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const product = lp.event || lp.service;
    const location = lp.location;

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
    console.error("PUT /location-pages", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   DELETE
   ===================================================== */
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
