import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SERVER client (secure)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: service key
);

// -----------------------------
// GET all location pages
// -----------------------------
export async function GET() {
  const { data, error } = await supabase
    .from("location_pages")
    .select(`
      id,
      title,
      slug,
      product_type,
      product_id,
      location_id,
      seo_title,
      seo_description,
      is_active,
      created_at,
      locations (id, name),
      events (id, title),
      services (id, title)
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// -----------------------------
// CREATE location-specific page
// -----------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { product_id, location_id, title, seo_title, seo_description } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json(
        { error: "product_id, location_id, and title are required" },
        { status: 400 }
      );
    }

    // AUTO-GENERATE SLUG
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // AUTO-DETECT product_type (NO UI needed)
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    // INSERT
    const { data, error } = await supabase
      .from("location_pages")
      .insert({
        product_type,
        product_id,
        location_id,
        title,
        slug,
        seo_title,
        seo_description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request: " + err.message },
      { status: 500 }
    );
  }
}

// -----------------------------
// DELETE location page
// -----------------------------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase.from("location_pages").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
