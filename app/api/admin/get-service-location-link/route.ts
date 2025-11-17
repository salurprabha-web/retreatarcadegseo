import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service_id = searchParams.get("service_id");
  const location_id = searchParams.get("location_id");

  const { data } = await supabase
    .from("location_service_links")
    .select("*")
    .eq("service_id", service_id)
    .eq("location_id", location_id)
    .single();

  return NextResponse.json(data || {});
}
