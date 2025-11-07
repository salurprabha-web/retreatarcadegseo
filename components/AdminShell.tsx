'use client';
import React from 'react';
import Sidebar from './Sidebar';
// FIX: Import usePathname to get the current path for the Sidebar.
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Fix: Defined props with an interface to resolve children type error
interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Important to clear server-side session state
  };

  return (
    <div className="flex min-h-screen bg-brand-dark font-sans">
      {/* FIX: Pass the current pathname to the Sidebar for active link highlighting. */}
      <Sidebar onLogout={handleLogout} currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
