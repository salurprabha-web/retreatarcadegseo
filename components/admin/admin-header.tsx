'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { signOut } from '@/lib/supabase-client';

type AdminHeaderProps = {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
};

export function AdminHeader({ title, showBackButton = true, backHref = '/admin/dashboard' }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/admin');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
