// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SECURE Supabase server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST be present in Vercel
);

// ---------------------------------------------------
// GET → list all location_pages
// ---------------------------------------------------
export async function GET() {
  const { data, error } = await supabase
    .from("location_pages")
    .select(`
      id,
      title,
      slug,
      canonical_url,
      seo_title,
      seo_description,
      product_type,
      product_id,
      location_id,
      is_active,
      created_at,
      updated_at,
      locations ( id, city, slug ),
      events ( id, title, slug ),
      services ( id, title, slug )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ---------------------------------------------------
// POST → Create new location-specific page
// ---------------------------------------------------
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

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Detect product type (event/service)
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id, slug")
      .eq("id", product_id)
      .maybeSingle();

    const isEvent = !!eventCheck;
    if (isEvent) product_type = "event";

    // Find product slug
    const productSlug = isEvent
      ? eventCheck.slug
      : (
          await supabase
            .from("services")
            .select("slug")
            .eq("id", product_id)
            .maybeSingle()
        )?.data?.slug;

    // Find location slug
    const { data: loc } = await supabase
      .from("locations")
      .select("slug, city")
      .eq("id", location_id)
      .maybeSingle();

    if (!productSlug || !loc?.slug) {
      return NextResponse.json(
        { error: "Invalid product_id or location_id" },
        { status: 400 }
      );
    }

    // Auto-generate canonical URL
    const canonical_url = `https://www.retreatarcade.in/${
      product_type === "service" ? "services" : "events"
    }/${productSlug}/${loc.slug}`;

    // Insert
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
        canonical_url,
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

// ---------------------------------------------------
// PUT → Update an existing location page
// ---------------------------------------------------
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, seo_title, seo_description, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Rebuild slug if title changed
    let slug;
    if (title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Fetch existing record
    const { data: lp } = await supabase
      .from("location_pages")
      .select("product_type, product_id, location_id")
      .eq("id", id)
      .maybeSingle();

    if (!lp) {
      return NextResponse.json({ error: "Location page not found" }, { status: 404 });
    }

    // Fetch product slug
    const productSlug =
      lp.product_type === "event"
        ? (
            await supabase
              .from("events")
              .select("slug")
              .eq("id", lp.product_id)
              .maybeSingle()
          )?.data?.slug
        : (
            await supabase
              .from("services")
              .select("slug")
              .eq("id", lp.product_id)
              .maybeSingle()
          )?.data?.slug;

    // Fetch location slug
    const { data: loc } = await supabase
      .from("locations")
      .select("slug")
      .eq("id", lp.location_id)
      .maybeSingle();

    // Auto-update canonical URL
    const canonical_url = `https://www.retreatarcade.in/${
      lp.product_type === "service" ? "services" : "events"
    }/${productSlug}/${loc.slug}`;

    const { data, error } = await supabase
      .from("location_pages")
      .update({
        title,
        slug,
        seo_title,
        seo_description,
        canonical_url,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid request: " + err.message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------
// DELETE → Remove a location page
// ---------------------------------------------------
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
