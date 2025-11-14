import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SERVER client (service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service key
);

// --------------------------------------------------
// GET — Return full list with merged product + location info
// --------------------------------------------------
export async function GET() {
  try {
    // 1) Fetch location pages
    const { data: pages, error: pagesErr } = await supabase
      .from("location_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (pagesErr) throw pagesErr;

    if (!pages || pages.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2) Fetch all locations
    const { data: allLocations } = await supabase
      .from("locations")
      .select("id, name, slug");

    // 3) Fetch all events
    const { data: allEvents } = await supabase
      .from("events")
      .select("id, title");

    // 4) Fetch all services
    const { data: allServices } = await supabase
      .from("services")
      .select("id, title");

    // 5) Merge data manually
    const merged = pages.map((p) => {
      const location = allLocations?.find((l) => l.id === p.location_id);

      let product = null;

      if (p.product_type === "event") {
        product = allEvents?.find((e) => e.id === p.product_id);
      } else {
        product = allServices?.find((s) => s.id === p.product_id);
      }

      return {
        ...p,
        location_name: location?.name || null,
        product_title: product?.title || null,
      };
    });

    return NextResponse.json({ data: merged });
  } catch (error: any) {
    console.error("❌ GET /location-pages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --------------------------------------------------
// POST — Create new location page
// --------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, location_id, title, seo_title, seo_description } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json(
        { error: "product_id, location_id and title required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Detect type
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

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("❌ POST /location-pages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --------------------------------------------------
// DELETE — Remove location page
// --------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("location_pages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ DELETE /location-pages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
