// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ------------------------------
// GET — fetch all location pages
// ------------------------------
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("location_pages")
      .select(
        `
        id,
        title,
        slug,
        product_type,
        is_active,
        created_at,
        locations (city, slug),
        services!inner(id, title, slug),
        events!inner(id, title, slug)
        `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("GET /location-pages", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// ------------------------------
// POST — create a location page
// ------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      product_type,
      product_id,
      location_id,
      title,
      slug,
      seo_title,
      seo_description,
      schema_json,
    } = body;

    if (!product_type || !product_id || !location_id || !title || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
        schema_json,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("POST /location-pages", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// ------------------------------
// DELETE — delete a location page
// ------------------------------
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location page ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("location_pages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /location-pages", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
