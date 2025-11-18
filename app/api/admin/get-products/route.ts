import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, is_active")
      .order("name", { ascending: true });

    if (error) {
      console.error("GET PRODUCTS ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (err: any) {
    console.error("API EXCEPTION:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
