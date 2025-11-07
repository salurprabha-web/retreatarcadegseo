'use client';
import React from 'react';
import Sidebar from './Sidebar';
// FIX: Import usePathname to get the current path for the Sidebar.
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from './ToastProvider';
import { createClient } from '@/lib/supabase/client';

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Important to clear server-side session state
  };

  // This function injects the showToast prop into any child component that needs it.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && typeof child.type === 'function') {
      const componentName = (child.type as any).displayName || child.type.name || '';
      if (componentName.endsWith('Manager')) {
        return React.cloneElement(child as React.ReactElement<any>, { showToast });
      }
    }
    return child;
  });

  return (
    <div className="flex min-h-screen bg-brand-dark font-sans">
      {/* FIX: Pass the current pathname to the Sidebar for active link highlighting. */}
      <Sidebar onLogout={handleLogout} currentPath={pathname} />
      <main className="flex-1 overflow-y-auto">
        {childrenWithProps}
      </main>
    </div>
  );
}
