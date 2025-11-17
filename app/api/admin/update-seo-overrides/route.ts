import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { service_id, location_id, seo_overrides_json } = await req.json();

  await supabase
    .from("location_service_links")
    .update({ seo_overrides_json })
    .eq("service_id", service_id)
    .eq("location_id", location_id);

  return NextResponse.json({ success: true });
}
