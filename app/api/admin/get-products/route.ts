import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events") // 👈 using events table as master products
      .select("id, title, slug, status, is_featured")
      .order("title", { ascending: true });

    if (error) {
      console.error("GET PRODUCTS SQL ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: Array.isArray(data) ? data : []
    });
  } catch (err: any) {
    console.error("GET PRODUCTS EXCEPTION:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
