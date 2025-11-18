import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service_id, location_id, seo } = body;

    if (!service_id || !location_id || !seo)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      service_id,
      location_id,
      ...seo,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("service_location_seo")
      .upsert(payload, {
        onConflict: "service_id,location_id",
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
