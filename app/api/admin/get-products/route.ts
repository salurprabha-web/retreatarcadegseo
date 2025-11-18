import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events") // master product table
      .select("id, title, slug, status")
      .order("title", { ascending: true });

    if (error) {
      console.error("GET PRODUCTS ERROR:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data || [] });
  } catch (err: any) {
    console.error("API EXCEPTION:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
