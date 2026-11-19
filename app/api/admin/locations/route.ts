// app/api/admin/locations/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { adminDb, requireAdmin } from "@/lib/page-generator";

// -----------------------
// GET — fetch all locations
// -----------------------
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Normalize shape for frontend dropdown
    const normalized = (data || []).map((loc) => ({
      id: String(loc.id),
      name: loc.city || loc.name || "",  // frontend expects name
      slug: loc.slug,
    }));

    return NextResponse.json({ data: normalized });
  } catch (err: any) {
    console.error("GET /locations", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// -----------------------
// POST — create new location
// -----------------------
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not signed in as admin" }, { status: 401 });
  try {
    const body = await req.json();
    const { state } = body;
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const { data: dup } = await adminDb().from("locations").select("id").eq("slug", slug).maybeSingle();
    if (dup) return NextResponse.json({ error: "A city with this slug already exists" }, { status: 400 });

    const { data, error } = await adminDb()
      .from("locations")
      .insert({
        city: name,   // stored as city in database
        slug,
        state: state || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        id: String(data.id),
        name: data.city,
        slug: data.slug,
      },
    });
  } catch (err: any) {
    console.error("POST /locations", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// -----------------------
// DELETE
// -----------------------
export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Not signed in as admin" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location ID required" },
        { status: 400 }
      );
    }

    const { error } = await adminDb()
      .from("locations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /locations", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
