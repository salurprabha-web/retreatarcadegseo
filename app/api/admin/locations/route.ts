// app/api/admin/locations/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --------- ENV VARIABLES ----------
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log missing env vars ONLY on server, not browser
if (!url || !serviceKey) {
  console.error("❌ Missing Supabase ENV");
  console.error("URL:", url);
  console.error("SERVICE ROLE KEY:", serviceKey ? "SET" : "MISSING");
}

const supabase = createClient(url || "", serviceKey || "");

// --------- GET: Fetch all Locations ----------
export async function GET() {
  try {
    console.log("📌 /api/admin/locations → GET");

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("❌ Supabase SELECT error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Locations fetched:", data.length);
    return NextResponse.json({ locations: data }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Unexpected API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --------- POST: Create Location ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📌 /api/admin/locations → POST", body);

    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name & slug are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("locations")
      .insert([{ name, slug }])
      .select();

    if (error) {
      console.error("❌ Supabase INSERT error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Location Created:", data);
    return NextResponse.json({ success: true, location: data }, { status: 201 });

  } catch (err: any) {
    console.error("❌ Unexpected POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
