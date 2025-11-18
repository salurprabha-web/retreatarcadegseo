import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE CLIENT WITH FULL ACCESS (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // <-- CRITICAL FIX
  {
    auth: { persistSession: false },
  }
);

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid rows payload" },
        { status: 400 }
      );
    }

    for (const r of rows) {
      if (!r.service_id || !r.location_id) {
        return NextResponse.json(
          { error: "Missing service_id or location_id", row: r },
          { status: 400 }
        );
      }

      const cleanRow = {
        service_id: r.service_id,
        location_id: r.location_id,
        is_enabled: !!r.is_enabled, // ensure boolean
      };

      const { error } = await supabase
        .from("service_locations")
        .upsert(cleanRow, {
          onConflict: "service_id,location_id",
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
    console.error("API EXCEPTION:", err);
    return NextResponse.json(
      { error: err.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
