// app/api/admin/locations/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    return NextResponse.json({ data });
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
  try {
    const body = await req.json();
    const { name, slug, state } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        city: name,
        slug,
        state: state || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("POST /locations", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// -----------------------
// DELETE — delete a location
// -----------------------
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Location ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
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
