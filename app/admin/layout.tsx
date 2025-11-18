"use client";

import Navbar from "@/components/admin/navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ADMIN NAVBAR - stays fixed at top */}
      <Navbar />

      {/* This padding pushes all content below navbar */}
      <div className="pt-20 pb-20 px-6">
        {children}
      </div>
    </div>
  );
}
