// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVER-ONLY
);

// -------------------------
// GET: List all location pages
// -------------------------
export async function GET() {
  const { data, error } = await supabase
    .from("location_pages")
    .select(`
      id,
      product_type,
      product_id,
      location_id,
      title,
      slug,
      seo_title,
      seo_description,
      canonical_url,
      created_at,
      locations(id, name, slug),
      events(id, title, slug),
      services(id, title, slug)
    `);

  if (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// -------------------------
// POST: Create a new location page
// -------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      product_id,
      location_id,
      title,
      slug,
      seo_title,
      seo_description,
      canonical_url,
    } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json(
        { error: "product_id, location_id, and title are required" },
        { status: 400 },
      );
    }

    // Auto-generate slug if not given
    const finalSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Auto-detect product_type from product_id
    let product_type: "service" | "event" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    const { data, error } = await supabase
      .from("location_pages")
      .insert({
        product_id,
        product_type,
        location_id,
        title,
        slug: finalSlug,
        seo_title,
        seo_description,
        canonical_url,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { error: "Invalid request: " + err.message },
      { status: 500 },
    );
  }
}

// -------------------------
// PUT: Update a location page
// -------------------------
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const {
      product_id,
      location_id,
      title,
      slug,
      seo_title,
      seo_description,
      canonical_url,
    } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json(
        { error: "product_id, location_id, and title are required" },
        { status: 400 },
      );
    }

    let product_type: "service" | "event" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    const finalSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const { data, error } = await supabase
      .from("location_pages")
      .update({
        product_type,
        product_id,
        location_id,
        title,
        slug: finalSlug,
        seo_title,
        seo_description,
        canonical_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { error: "Invalid request: " + err.message },
      { status: 500 },
    );
  }
}

// -------------------------
// DELETE: Delete location page
// -------------------------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

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

  return NextResponse.json({ success: true });
}
