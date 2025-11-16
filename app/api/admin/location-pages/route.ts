import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Service-role Supabase (required for admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Skip sitemap for now
async function regenerateSitemap() {
  console.log("Sitemap placeholder executed");
  return true;
}

function buildSchema(lp: any, product: any, location: any) {
  return {
    "@context": "https://schema.org",
    "@type": lp.product_type === "event" ? "Event" : "Service",
    name: lp.title,
    description: lp.seo_description || product?.description || "",
    areaServed: location?.name || "",
    url: lp.canonical_url,
  };
}

/* =====================================================
   GET — ALL LOCATION PAGES (Works with NO product FK)
   ===================================================== */
export async function GET() {
  try {
    // Step 1: fetch location pages
    const { data: pages, error } = await supabase
      .from("location_pages")
      .select("*");

    if (error) {
      console.error("GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 2: get all locations
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name, slug");

    // Step 3: get all events + services
    const [{ data: events }, { data: services }] = await Promise.all([
      supabase.from("events").select("id, title, slug, description"),
      supabase.from("services").select("id, title, slug, description"),
    ]);

    // Step 4: merge manually
    const result = pages.map((lp) => {
      const location = locations?.find((l) => l.id === lp.location_id) || null;

      const product =
        events?.find((e) => e.id === lp.product_id) ||
        services?.find((s) => s.id === lp.product_id) ||
        null;

      return {
        ...lp,
        location,
        product,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("GET /location-pages err:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   POST — Create Location Page
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

    // SLUG
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Detect product type
    let product_type: "event" | "service" = "service";

    const { data: eventItem } = await supabase
      .from("events")
      .select("slug, title")
      .eq("id", product_id)
      .maybeSingle();

    const { data: serviceItem } = await supabase
      .from("services")
      .select("slug, title")
      .eq("id", product_id)
      .maybeSingle();

    const product = eventItem || serviceItem;

    if (eventItem) product_type = "event";
    if (!product?.slug) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    // Get location
    const { data: location } = await supabase
      .from("locations")
      .select("name, slug")
      .eq("id", location_id)
      .maybeSingle();

    if (!location?.slug) {
      return NextResponse.json({ error: "Location not found" }, { status: 400 });
    }

    // Canonical
    const canonical_url = `https://www.retreatarcade.in/${
      product_type === "event" ? "events" : "services"
    }/${product.slug}/${location.slug}`;

    // Schema
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
      console.error("POST error:", error);
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
   PUT — Update
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
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!lp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch product
    const { data: eventItem } = await supabase
      .from("events")
      .select("slug, description")
      .eq("id", lp.product_id)
      .maybeSingle();

    const { data: serviceItem } = await supabase
      .from("services")
      .select("slug, description")
      .eq("id", lp.product_id)
      .maybeSingle();

    const product = eventItem || serviceItem;

    const { data: location } = await supabase
      .from("locations")
      .select("slug, name")
      .eq("id", lp.location_id)
      .maybeSingle();

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
