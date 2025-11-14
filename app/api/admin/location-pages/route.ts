import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// ---------- GET HANDLER ---------- //
// Supports:
// ?mode=products  → returns combined events + services
// ?mode=list      → returns all location_pages

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // 1️⃣ GET PRODUCTS (events + services)
    if (mode === "products") {
      const [eventsRes, servicesRes] = await Promise.all([
        supabase.from("events").select("id, title, slug").eq("status", "published"),
        supabase.from("services").select("id, title, slug").eq("status", "published"),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const events = eventsRes.data.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        product_type: "event",
      }));

      const services = servicesRes.data.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        product_type: "service",
      }));

      return NextResponse.json({ data: [...events, ...services] });
    }

    // 2️⃣ GET ALL LOCATION PAGES
    if (mode === "list") {
      const { data, error } = await supabase
        .from("location_pages")
        .select(
          `
          id,
          product_type,
          product_id,
          location_id,
          title,
          slug,
          seo_title,
          seo_description,
          override_price,
          schema_json,
          locations (name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err: any) {
    console.error("GET /location-pages error", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch" },
      { status: 500 }
    );
  }
}

// ---------- POST HANDLER ---------- //
// Create or update location-specific page

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const body = await req.json();

    const {
      product_type,
      product_id,
      location_id,
      title,
      slug,
      seo_title,
      seo_description,
      override_price,
      schema_json,
    } = body;

    if (!product_type || !product_id || !location_id || !title || !slug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Prevent duplicates
    const existing = await supabase
      .from("location_pages")
      .select("id")
      .eq("product_type", product_type)
      .eq("product_id", product_id)
      .eq("location_id", location_id)
      .maybeSingle();

    if (existing.data) {
      // UPDATE instead of creating new
      const update = await supabase
        .from("location_pages")
        .update({
          title,
          slug,
          seo_title,
          seo_description,
          override_price,
          schema_json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id)
        .select()
        .maybeSingle();

      if (update.error) throw update.error;

      return NextResponse.json({
        message: "Updated existing location page",
        data: update.data,
      });
    }

    // 2️⃣ CREATE NEW LOCATION PAGE
    const insert = await supabase
      .from("location_pages")
      .insert({
        product_type,
        product_id,
        location_id,
        title,
        slug,
        seo_title,
        seo_description,
        override_price,
        schema_json,
      })
      .select()
      .maybeSingle();

    if (insert.error) throw insert.error;

    return NextResponse.json({
      message: "Location page created",
      data: insert.data,
    });
  } catch (err: any) {
    console.error("POST /location-pages error", err);
    return NextResponse.json(
      { error: err.message || "Failed to create" },
      { status: 500 }
    );
  }
}

// ---------- DELETE HANDLER ---------- //

export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const del = await supabase
      .from("location_pages")
      .delete()
      .eq("id", id);

    if (del.error) throw del.error;

    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("DELETE /location-pages error", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
