// app/api/admin/locations/route.ts
import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server config missing' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const body = await req.json();
    const { name, slug, state, is_active } = body;
    if (!name || !slug) return new Response(JSON.stringify({ error: 'name & slug required' }), { status: 400 });

    const { data, error } = await supabase.from('locations').insert([{ city: name, slug, state: state || null, is_active: is_active ?? true }]).select().maybeSingle();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
