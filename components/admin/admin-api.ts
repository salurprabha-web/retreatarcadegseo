import { supabase } from '@/lib/supabase-client';

/** Calls one of the admin API routes as the signed-in admin. */
export async function adminApi(path: string, body?: any) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e: any = new Error(json.error || `Request failed (${res.status})`);
    e.data = json;
    throw e;
  }
  return json;
}
