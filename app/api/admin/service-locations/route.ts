import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service_id, location_id, is_enabled } = body;

    if (!service_id || !location_id) {
      return NextResponse.json(
        { error: "Missing service_id or location_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("service_locations")
      .upsert(
        {
          service_id,
          location_id,
          is_enabled: is_enabled ?? true,
        },
        { onConflict: "service_id,location_id" }
      );

    if (error) {
      console.error("UPSERT ERROR", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
