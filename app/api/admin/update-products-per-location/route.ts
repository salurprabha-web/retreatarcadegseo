import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { service_id, location_id, products_json } = body;

  await supabase
    .from("location_service_links")
    .update({ products_json })
    .eq("service_id", service_id)
    .eq("location_id", location_id);

  return NextResponse.json({ success: true });
}
