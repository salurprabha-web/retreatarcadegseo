import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: services } = await supabase.from("services").select("*");

  const response = [];

  for (const s of services || []) {
    const { data: links } = await supabase
      .from("location_service_links")
      .select("*, locations(city)")
      .eq("service_id", s.id);

    response.push({
      service_id: s.id,
      service_title: s.title,
      locations: links?.map((l) => l.locations.city) || [],
    });
  }

  return NextResponse.json(response);
}
