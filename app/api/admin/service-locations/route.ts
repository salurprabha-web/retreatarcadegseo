import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { service_id, location_ids } = await req.json();

  if (!service_id) {
    return NextResponse.json({ error: "Missing service_id" }, { status: 400 });
  }

  // Delete old assignments
  await supabase
    .from("location_service_links")
    .delete()
    .eq("service_id", service_id);

  // Insert new assignments
  if (Array.isArray(location_ids) && location_ids.length > 0) {
    const rows = location_ids.map((locId) => ({
      service_id,
      location_id: locId,
      products_json: [],            // default empty, you can update later
      seo_overrides_json: {},       // default overrides
    }));

    await supabase.from("location_service_links").insert(rows);
  }

  return NextResponse.json({ success: true });
}
