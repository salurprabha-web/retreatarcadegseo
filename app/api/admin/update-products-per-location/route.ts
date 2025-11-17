import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const { service_id, location_id, products_json } = body;
  if (!service_id || !location_id) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  const { error } = await supabase
    .from("location_service_links")
    .update({ products_json })
    .eq("service_id", service_id)
    .eq("location_id", location_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
