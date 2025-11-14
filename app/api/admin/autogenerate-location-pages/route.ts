import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // 1. Get all active locations
    const { data: locations, error: locErr } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true);

    if (locErr) throw locErr;

    // 2. Get all services
    const { data: services, error: servErr } = await supabase
      .from("services")
      .select("id, title, slug, summary, image_url")
      .eq("status", "published");

    if (servErr) throw servErr;

    // 3. Get all events
    const { data: events, error: evtErr } = await supabase
      .from("events")
      .select("id, title, slug, summary, image_url")
      .eq("status", "published");

    if (evtErr) throw evtErr;

    let createdCount = 0;

    // --------------- SLUG HELPER ---------------
    const makeSlug = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // =============== SERVICES ===============
    for (const s of services) {
      for (const loc of locations) {
        const pageSlug = makeSlug(`${s.slug} ${loc.slug}`);

        // check if exists
        const { data: exists } = await supabase
          .from("location_pages")
          .select("id")
          .eq("product_type", "service")
          .eq("product_id", s.id)
          .eq("location_id", loc.id)
          .maybeSingle();

        if (!exists) {
          await supabase.from("location_pages").insert({
            product_type: "service",
            product_id: s.id,
            location_id: loc.id,
            title: `${s.title} in ${loc.city}`,
            slug: pageSlug,
            seo_title: `${s.title} in ${loc.city} – Retreat Arcade`,
            seo_description: s.summary,
            schema_json: {
              "@context": "https://schema.org",
              "@type": "Service",
              name: `${s.title} in ${loc.city}`,
              description: s.summary,
            },
          });
          createdCount++;
        }
      }
    }

    // =============== EVENTS ===============
    for (const e of events) {
      for (const loc of locations) {
        const pageSlug = makeSlug(`${e.slug} ${loc.slug}`);

        const { data: exists } = await supabase
          .from("location_pages")
          .select("id")
          .eq("product_type", "event")
          .eq("product_id", e.id)
          .eq("location_id", loc.id)
          .maybeSingle();

        if (!exists) {
          await supabase.from("location_pages").insert({
            product_type: "event",
            product_id: e.id,
            location_id: loc.id,
            title: `${e.title} in ${loc.city}`,
            slug: pageSlug,
            seo_title: `${e.title} in ${loc.city} – Retreat Arcade`,
            seo_description: e.summary,
            schema_json: {
              "@context": "https://schema.org",
              "@type": "Product",
              name: `${e.title} in ${loc.city}`,
              description: e.summary,
            },
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-generation complete`,
      created: createdCount,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
