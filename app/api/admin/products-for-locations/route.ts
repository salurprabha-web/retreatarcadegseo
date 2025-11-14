// app/api/admin/products-for-locations/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Return BOTH services + events for the admin to create location pages
export async function GET() {
  try {
    // Fetch services
    const { data: services, error: serviceError } = await supabase
      .from("services")
      .select("id, title, slug")
      .eq("status", "published");

    if (serviceError) throw serviceError;

    // Fetch events
    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("id, title, slug")
      .eq("status", "published");

    if (eventError) throw eventError;

    // Normalize into one list
    const merged = [
      ...(services || []).map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        product_type: "service" as const,
      })),
      ...(events || []).map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        product_type: "event" as const,
      })),
    ];

    return NextResponse.json({ data: merged });
  } catch (err: any) {
    console.error("products-for-locations:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
