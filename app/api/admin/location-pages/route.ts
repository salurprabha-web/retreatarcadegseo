// app/api/admin/location-pages/route.ts
import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('location_pages')
      .select('*, locations:location_id (id, city, slug), services:product_id (id, title, slug), events:product_id (id, title, slug)');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const body = await req.json();
    const { product_type, product_id, location_id, title, slug, seo_title, seo_description, schema_json, is_active } = body;
    if (!product_type || !product_id || !location_id || !title || !slug) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const payload = {
      product_type,
      product_id,
      location_id,
      title,
      slug,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      schema_json: schema_json || null,
      is_active: is_active ?? true,
    };

    const { data, error } = await supabase.from('location_pages').insert([payload]).select().maybeSingle();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const body = await req.json();
    const { id, title, slug, seo_title, seo_description, schema_json, is_active } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    const { data, error } = await supabase.from('location_pages').update({
      title, slug, seo_title, seo_description, schema_json, is_active
    }).eq('id', id).select().maybeSingle();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    const { error } = await supabase.from('location_pages').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
