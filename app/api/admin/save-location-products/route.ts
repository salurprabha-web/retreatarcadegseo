import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service_id, location_id, products } = body;

    if (!service_id || !location_id || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid payload", received: body },
        { status: 400 }
      );
    }

    // IMPORTANT: server-side Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // FULL ACCESS
      { auth: { persistSession: false } }
    );

    // Build upsert array
    const rows = products.map((p: any) => ({
      service_id,
      location_id,
      product_id: p.id,
      is_enabled: p.enabled ?? false,
    }));

    // Insert/update rows
    const { error } = await supabase
      .from("service_location_products")
      .upsert(rows, {
        onConflict: "service_id,location_id,product_id",
      });

    if (error) {
      console.error("UPSERT ERROR:", error);
      return NextResponse.json(
        { error: error.message, rows },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
