"use client";

import Navbar from "@/components/admin/navbar";

// ✅ Prevent Google from indexing admin pages — saves crawl budget for money pages
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ noindex meta tag — admin pages must never appear in Google */}
      <meta name="robots" content="noindex,nofollow" />

      <Navbar />
      <div className="pt-20 pb-20 px-6">
        {children}
      </div>
    </div>
  );
}
