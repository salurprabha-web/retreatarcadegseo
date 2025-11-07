import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
