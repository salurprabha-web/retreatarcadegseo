// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error("Supabase env vars required");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// helper
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // optional filters
    const product_type = searchParams.get("product_type"); // event|service|null
    const is_active = searchParams.get("is_active");

    let q = supabase
      .from("location_pages")
      .select(`
        id,
        title,
        slug,
        product_type,
        product_id,
        location_id,
        seo_title,
        seo_description,
        schema_json,
        override_price,
        is_active,
        created_at,
        updated_at,
        locations (id, city, slug),
        events (id, title, slug),
        services (id, title, slug)
      `)
      .order("created_at", { ascending: false });

    if (product_type) q = q.eq("product_type", product_type);
    if (is_active) q = q.eq("is_active", is_active === "true");

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Bulk generator: { bulk: true, product_type: 'service'|'event', locations: [location_id,...], products: [product_id,...] }
    if (body?.bulk) {
      const product_type = body.product_type || "service";
      const locationIds = body.locations || [];
      const productIds = body.products || [];

      if (!Array.isArray(locationIds) || !Array.isArray(productIds) || locationIds.length === 0 || productIds.length === 0) {
        return NextResponse.json({ error: "locations and products arrays required for bulk" }, { status: 400 });
      }

      const created: any[] = [];
      for (const loc of locationIds) {
        for (const pid of productIds) {
          // skip existing
          const { data: exists } = await supabase
            .from("location_pages")
            .select("id")
            .eq("product_type", product_type)
            .eq("product_id", pid)
            .eq("location_id", loc)
            .maybeSingle();

          if (exists) continue;

          // fetch product title
          let titleBase = "Product";
          if (product_type === "event") {
            const ev = await supabase.from("events").select("title").eq("id", pid).maybeSingle();
            titleBase = ev.data?.title || titleBase;
          } else {
            const sv = await supabase.from("services").select("title").eq("id", pid).maybeSingle();
            titleBase = sv.data?.title || titleBase;
          }

          // fetch location name
          const l = await supabase.from("locations").select("city").eq("id", loc).maybeSingle();
          const locName = l.data?.city || "Location";

          const title = `${titleBase} in ${locName}`;
          const slug = slugify(title);

          const { data, error } = await supabase
            .from("location_pages")
            .insert({
              product_type,
              product_id: pid,
              location_id: loc,
              title,
              slug,
              seo_title: `Best ${title} – Affordable Prices`,
              seo_description: `Hire ${titleBase} in ${locName}. High-quality, affordable, and professional service for events.`,
              is_active: true,
            })
            .select()
            .single();

          if (!error && data) created.push(data);
        }
      }

      return NextResponse.json({ created }, { status: 201 });
    }

    // Single create
    const { product_id, location_id, title, seo_title, seo_description, schema_json, override_price } = body;

    if (!product_id || !location_id || !title) {
      return NextResponse.json({ error: "product_id, location_id and title required" }, { status: 400 });
    }

    // detect product_type
    let product_type: "event" | "service" = "service";
    const { data: eventCheck } = await supabase.from("events").select("id").eq("id", product_id).maybeSingle();
    if (eventCheck) product_type = "event";

    const slug = slugify(title);

    const { data, error } = await supabase
      .from("location_pages")
      .insert({
        product_type,
        product_id,
        location_id,
        title,
        slug,
        seo_title: seo_title || `Best ${title} – Affordable Prices`,
        seo_description: seo_description || "",
        schema_json: schema_json || null,
        override_price: override_price || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, seo_title, seo_description, schema_json, is_active, override_price } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const slug = title ? slugify(title) : undefined;

    const updates: any = {};
    if (title) updates.title = title;
    if (slug) updates.slug = slug;
    if (seo_title !== undefined) updates.seo_title = seo_title;
    if (seo_description !== undefined) updates.seo_description = seo_description;
    if (schema_json !== undefined) updates.schema_json = schema_json;
    if (is_active !== undefined) updates.is_active = is_active;
    if (override_price !== undefined) updates.override_price = override_price;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("location_pages").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("location_pages").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
