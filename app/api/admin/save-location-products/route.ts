import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { service_id, location_id, products } = await req.json();

    if (!service_id || !location_id || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid payload", received: { service_id, location_id, products } },
        { status: 400 }
      );
    }

    // 1️⃣ Delete previous rows
    const { error: delErr } = await supabase
      .from("service_location_products")
      .delete()
      .eq("service_id", service_id)
      .eq("location_id", location_id);

    if (delErr) {
      console.error("DELETE ERROR:", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // 2️⃣ Insert new rows
    const newRows = products.map((p: any) => ({
      service_id,
      location_id,
      product_id: p.id,
      is_enabled: p.enabled,
    }));

    const { error: insErr } = await supabase
      .from("service_location_products")
      .insert(newRows);

    if (insErr) {
      console.error("INSERT ERROR:", insErr);
      return NextResponse.json({ error: insErr.message, rows: newRows }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API EXCEPTION:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
