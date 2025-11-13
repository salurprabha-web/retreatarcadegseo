// app/api/admin/locations/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('locations').select('*').order('name', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('GET /api/admin/locations error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, active = true } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug required' }, { status: 400 });
    }
    const { data, error } = await supabase.from('locations').insert([{ name, slug, active }]).select().single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/locations error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { data, error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('DELETE /api/admin/locations error', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
