import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const service_id = searchParams.get("service_id");
  const location_id = searchParams.get("location_id");

  if (!service_id || !location_id) {
    return NextResponse.json(
      { error: "Missing service_id or location_id" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("service_locations")
    .select("*")
    .eq("service_id", service_id)
    .eq("location_id", location_id)
    .maybeSingle();

  return NextResponse.json({ ok: true, data, error });
}
