import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = body.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid rows payload" },
        { status: 400 }
      );
    }

    // Validate every row has required fields
    for (const r of rows) {
      if (!r.service_id || !r.location_id) {
        return NextResponse.json(
          { error: "Missing service_id or location_id in row" },
          { status: 400 }
        );
      }
    }

    // Bulk upsert
    const { error } = await supabase
      .from("service_locations")
      .upsert(rows, {
        onConflict: "service_id,location_id",
      });

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
