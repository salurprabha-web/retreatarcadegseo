// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Secure server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------------------
// GET — Fetch all location pages
// ----------------------------------------------------
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
      canonical_url,
      schema_json,
      is_active,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ----------------------------------------------------
// POST — Create new location page
// ----------------------------------------------------
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

    // Create slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Determine product type (auto)
    let product_type: "event" | "service" = "service";

    const { data: eventCheck } = await supabase
      .from("events")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();

    if (eventCheck) product_type = "event";

    // Fetch product
    const productTable = product_type === "service" ? "services" : "events";
    const { data: product } = await supabase
      .from(productTable)
      .select("slug, title")
      .eq("id", product_id)
      .maybeSingle();

    // Fetch location
    const { data: location } = await supabase
      .from("locations")
      .select("slug, city")
      .eq("id", location_id)
      .maybeSingle();

    // Generate canonical
    let canonical_url = null;
    if (product && location) {
      canonical_url = `https://www.retreatarcade.in/${
        product_type === "service" ? "services" : "events"
      }/${product.slug}/${location.slug}`;
    }

    // Auto JSON-LD schema
    let schema_json = {
      "@context": "https://schema.org",
      "@type": product_type === "service" ? "Service" : "Event",
      name: title,
      description: seo_description || "",
      url: canonical_url,
      areaServed: {
        "@type": "City",
        name: location?.city,
      },
      provider: {
        "@type": "Organization",
        name: "Retreat Arcade",
        url: "https://www.retreatarcade.in",
      },
    };

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
        schema_json,
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

// ----------------------------------------------------
// PUT — Update location page (edit mode)
// ----------------------------------------------------
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      seo_title,
      seo_description,
      product_id,
      location_id,
      regenerate_schema,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Fetch existing page
    const { data: lp } = await supabase
      .from("location_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!lp) {
      return NextResponse.json({ error: "location page not found" }, { status: 404 });
    }

    // Fetch product
    const productTable = lp.product_type === "service" ? "services" : "events";
    const { data: product } = await supabase
      .from(productTable)
      .select("slug, title")
      .eq("id", product_id || lp.product_id)
      .maybeSingle();

    // Fetch location
    const { data: location } = await supabase
      .from("locations")
      .select("slug, city")
      .eq("id", location_id || lp.location_id)
      .maybeSingle();

    // Canonical
    let canonical_url = lp.canonical_url;
    if (product && location) {
      canonical_url = `https://www.retreatarcade.in/${
        lp.product_type === "service" ? "services" : "events"
      }/${product.slug}/${location.slug}`;
    }

    // Schema
    let schema_json = lp.schema_json;

    if (regenerate_schema && product && location) {
      schema_json = {
        "@context": "https://schema.org",
        "@type": lp.product_type === "service" ? "Service" : "Event",
        name: title || lp.title,
        description: seo_description || lp.seo_description,
        url: canonical_url,
        areaServed: {
          "@type": "City",
          name: location.city,
        },
        provider: {
          "@type": "Organization",
          name: "Retreat Arcade",
          url: "https://www.retreatarcade.in",
        },
      };
    }

    // Update record
    const { data, error } = await supabase
      .from("location_pages")
      .update({
        title,
        seo_title,
        seo_description,
        canonical_url,
        schema_json,
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

// ----------------------------------------------------
// DELETE — Remove location page
// ----------------------------------------------------
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
