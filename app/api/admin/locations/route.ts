// app/api/admin/locations/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // IMPORTANT: must be service role
  {
    auth: { persistSession: false }
  }
);

// GET — fetch all locations
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase GET Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: data });
  } catch (err: any) {
    console.error('API /locations GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — add new location
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('locations')
      .insert([{ name, slug, is_active: true }])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ location: data });
  } catch (err: any) {
    console.error('API /locations POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
