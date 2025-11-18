import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected rows: []" },
        { status: 400 }
      );
    }

    for (const row of rows) {
      if (!row.service_id || !row.location_id || !row.product_id) {
        return NextResponse.json(
          {
            error: "Missing service_id, location_id, or product_id",
            row,
          },
          { status: 400 }
        );
      }

      const cleanRow = {
        service_id: row.service_id,
        location_id: row.location_id,
        product_id: row.product_id,
        is_enabled: !!row.is_enabled,
      };

      const { error } = await supabase
        .from("service_location_products")
        .upsert(cleanRow, {
          onConflict: "service_id,location_id,product_id",
        });

      if (error) {
        console.error("UPSERT ERROR:", cleanRow, error);
        return NextResponse.json(
          { error: error.message, row: cleanRow },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SAVE PRODUCTS EXCEPTION:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
