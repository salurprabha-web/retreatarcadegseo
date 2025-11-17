import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as any;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const text = await file.text();
    // Expect CSV with header: city,slug,state,is_active
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const header = lines.shift();
    if (!header) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

    const rows = lines.map(line => {
      const cols = line.split(",").map(c => c.trim());
      return {
        city: cols[0] || "",
        slug: (cols[1] || "").toLowerCase().replace(/\s+/g, "-"),
        state: cols[2] || null,
        is_active: (cols[3] || "true").toLowerCase() !== "false"
      };
    });

    // Upsert into locations (using unique slug)
    for (const r of rows) {
      await supabase
        .from("locations")
        .upsert({ city: r.city, slug: r.slug, state: r.state, is_active: r.is_active }, { onConflict: "slug" });
    }

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
