import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { service_id, location_id } = await req.json();

    if (!service_id || !location_id)
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("service_location_seo")
      .select("*")
      .eq("service_id", service_id)
      .eq("location_id", location_id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ seo: data ?? {} });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
