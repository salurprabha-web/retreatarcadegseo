import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const { service_id, location_ids } = body;
  if (!service_id) return NextResponse.json({ error: "Missing service_id" }, { status: 400 });

  // remove old mappings for this service
  await supabase.from("location_service_links").delete().eq("service_id", service_id);

  // insert new rows
  if (Array.isArray(location_ids) && location_ids.length > 0) {
    const rows = location_ids.map((locId: string) => ({
      service_id,
      location_id: locId,
      products_json: [],
      seo_overrides_json: {},
      pricing_json: {}
    }));
    const { error } = await supabase.from("location_service_links").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
