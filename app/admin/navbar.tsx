"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow z-50 h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">Admin Panel</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">View Site</Button>
          </Link>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
