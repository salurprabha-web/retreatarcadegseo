import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // IMPORTANT
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("events") // ✅ CORRECT TABLE (not products!)
      .select("id, title, slug, status, is_featured")
      .order("title", { ascending: true });

    if (error) {
      console.error("GET PRODUCTS SQL ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: Array.isArray(data) ? data : []
    });
  } catch (err: any) {
    console.error("GET PRODUCTS EXCEPTION:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
