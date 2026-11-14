'use client';

import { usePathname } from 'next/navigation';

/** Website header, footer and WhatsApp button are for visitors only: not shown inside the admin panel. */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  return <>{children}</>;
}
