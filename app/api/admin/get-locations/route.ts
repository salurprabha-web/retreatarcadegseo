import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("is_active", true)
    .order("city");

  return NextResponse.json(data || []);
}
