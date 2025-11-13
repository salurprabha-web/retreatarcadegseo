// app/api/admin/location-pages/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const product_id = url.searchParams.get("product_id");
  const location_id = url.searchParams.get("location_id");

  let q = supabase.from("location_pages").select("*");
  if (product_id) q = q.eq("product_id", product_id);
  if (location_id) q = q.eq("location_id", location_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    location_id,
    product_id,
    product_type,
    custom_title,
    custom_description,
    meta_title,
    meta_description,
    schema_json,
    override_price,
  } = body;

  // upsert by (location_id, product_id)
  const { data, error } = await supabase
    .from("location_pages")
    .upsert(
      [
        {
          location_id,
          product_id,
          product_type,
          custom_title,
          custom_description,
          meta_title,
          meta_description,
          schema_json,
          override_price,
        },
      ],
      { onConflict: "(location_id, product_id)" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("location_pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
