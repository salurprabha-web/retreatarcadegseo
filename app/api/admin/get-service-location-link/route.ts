import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service_id = searchParams.get("service_id");
  const location_id = searchParams.get("location_id");
  if (!service_id || !location_id) return NextResponse.json({}, { status: 400 });

  const { data, error } = await supabase
    .from("location_service_links")
    .select("*")
    .eq("service_id", service_id)
    .eq("location_id", location_id)
    .single();

  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || {});
}
