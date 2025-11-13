import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing environment variables for Supabase.");
}

const supabase = createClient(url!, serviceKey!);

// ----------------------
// GET: Fetch all locations
// ----------------------
export async function GET() {
  try {
    console.log("📌 Fetching locations...");

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("city", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Unexpected error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ----------------------
// POST: Create a new location
// ----------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { city, slug, state } = body;

    if (!city || !slug) {
      return NextResponse.json(
        { error: "city & slug are required fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([{ city, slug, state }])
      .select();

    if (error) {
      console.error("❌ Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, location: data }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Unexpected POST error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
