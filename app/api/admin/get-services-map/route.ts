import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: services } = await supabase.from("services").select("id,title");
  const result: any[] = [];

  for (const s of services || []) {
    const { data: links } = await supabase
      .from("location_service_links")
      .select("locations(city)")
      .eq("service_id", s.id);

    result.push({
      service_id: s.id,
      service_title: s.title,
      locations: (links || []).map((l: any) => l.locations.city)
    });
  }

  return NextResponse.json(result);
}
