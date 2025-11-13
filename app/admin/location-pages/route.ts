// app/api/admin/location-pages/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('location_pages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('GET /api/admin/location-pages error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected payload: { product_type: 'events'|'services', slug, location_slug, title, meta_title, meta_description, canonical_url, schema_json }
    const required = ['product_type', 'slug', 'location_slug', 'title'];
    for (const k of required) {
      if (!body[k]) return NextResponse.json({ error: `${k} required` }, { status: 400 });
    }
    const payload = {
      product_type: body.product_type,
      slug: body.slug,
      location_slug: body.location_slug,
      title: body.title,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      canonical_url: body.canonical_url || null,
      schema_json: body.schema_json ? body.schema_json : null,
    };

    const { data, error } = await supabase.from('location_pages').insert([payload]).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/location-pages error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { data, error } = await supabase.from('location_pages').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('DELETE /api/admin/location-pages error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
