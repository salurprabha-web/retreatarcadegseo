import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { regenerateSitemap } from "@/lib/sitemap-generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------
// JSON-LD GENERATOR
// ----------------------------------------
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

// ========================================
// GET — All location pages
// ========================================
export async function GET() {
  const { data, error } = await supabase
    .from("location_pages")
    .select(`
      *,
      locations ( id, name, slug ),
      events ( id, slug, title ),
      services ( id, slug, title )
    `);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// ========================================
// POST — Create new location page
// ========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, location_id, title, seo_title, seo_description } = body;

    if (!product_id || !location_id || !title)
      return NextResponse.json(
        { error: "product_id, location_id, title required" },
        { status: 400 }
      );

    // slugify
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // detect product type
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();
    if (eventCheck) product_type = "event";

    // fetch joins
    const { data: location } = await supabase
      .from("locations")
      .select("name, slug")
      .eq("id", location_id)
      .maybeSingle();

    const productTable = product_type === "event" ? "events" : "services";
    const { data: product } = await supabase
      .from(productTable)
      .select("slug, title, description")
      .eq("id", product_id)
      .maybeSingle();

    // canonical URL
    const canonical_url = `https://www.retreatarcade.in/${product_type === "event" ? "events" : "services"}/${product.slug}/${location.slug}`;

    // build schema
    const schema_json = buildSchema(
      { title, seo_description, product_type, canonical_url },
      product,
      location
    );

    // INSERT
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

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // REBUILD SITEMAP
    await regenerateSitemap();

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ========================================
// PUT — Edit location page
// ========================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, seo_title, seo_description } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // fetch existing
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

    if (!lp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // rebuild canonical if needed
    const productSlug =
      lp.product_type === "event" ? lp.events?.slug : lp.services?.slug;

    const canonical_url = `https://www.retreatarcade.in/${lp.product_type === "event" ? "events" : "services"}/${productSlug}/${lp.locations.slug}`;

    // rebuild schema
    const schema_json = buildSchema(
      { ...lp, title, seo_description, canonical_url },
      lp.events || lp.services,
      lp.locations
    );

    // UPDATE
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

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // REBUILD SITEMAP
    await regenerateSitemap();

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ========================================
// DELETE
// ========================================
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("location_pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await regenerateSitemap();

  return NextResponse.json({ success: true });
}
