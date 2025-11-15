// app/api/admin/products-for-locations/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Services
    const { data: services, error: serviceError } = await supabase
      .from("services")
      .select("id, title, slug")
      .eq("status", "published");

    if (serviceError) throw serviceError;

    // Events
    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("id, title, slug")
      .eq("status", "published");

    if (eventError) throw eventError;

    // Normalize to frontend format
    const merged = [
      ...(services || []).map((s) => ({
        id: String(s.id),
        title: s.title,
        slug: s.slug,
        type: "service" as const,   // 👈 FIX: changed product_type → type
      })),
      ...(events || []).map((e) => ({
        id: String(e.id),
        title: e.title,
        slug: e.slug,
        type: "event" as const,     // 👈 FIX: changed product_type → type
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
