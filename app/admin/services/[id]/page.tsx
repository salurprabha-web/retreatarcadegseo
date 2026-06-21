"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export default function ServiceAdminPage({ params }: { params: { id: string } }) {
  const serviceId = params.id;
  const router = useRouter();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, []);

  async function loadService() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (!error) setService(data);
    setLoading(false);
  }

  if (loading)
    return <div className="p-8 text-lg">Loading service...</div>;

  if (!service)
    return <div className="p-8 text-lg text-red-600">Service not found.</div>;

  // ✅ FIX: Tech services (software/website/app builds) have no physical
  // delivery location, no rentable products, no per-city pricing — the
  // entire Locations/Products/Pricing machinery below was previously shown
  // for EVERY service regardless of type, which made no sense for something
  // like Event Registration Software.
  const isTechService = service.is_tech_service === true;

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">{service.title}</h1>
        {isTechService && (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            <Cpu className="h-3 w-3" /> Technology Service
          </span>
        )}
      </div>

      {isTechService ? (
        // ─────────────────────────────────────────────────────────────
        // ✅ TECH SERVICE — simplified management, no locations/products
        // ─────────────────────────────────────────────────────────────
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Edit the description, features list, FAQ content and SEO fields for this technology service.
                </p>
                <Link href={`/admin/services/${serviceId}/edit`}>
                  <Button className="w-full">Edit Service Content</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Why No Locations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">
                  Technology services (software, websites, apps) are built and delivered remotely — they don't have physical delivery locations, rentable products, or per-city pricing like equipment rentals do. This service is automatically excluded from the Locations × Products system.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> To switch this back to a standard rental service with location-based pricing, uncheck "This is a Technology Service" on the{" "}
              <Link href={`/admin/services/${serviceId}/edit`} className="text-blue-600 underline">Edit page</Link>.
            </p>
          </div>
        </>
      ) : (
        // ─────────────────────────────────────────────────────────────
        // Standard rental service — original Locations/Products/Pricing UI
        // ─────────────────────────────────────────────────────────────
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/admin/services/${serviceId}/edit`}>
                  <Button className="w-full">Edit Service</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locations for this Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/admin/services/${serviceId}/locations`}>
                  <Button className="w-full">Manage Locations</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-3">Location-Level Features</h2>
            <p className="text-gray-600 mb-3">
              After choosing a location under <strong>Manage Locations</strong>, the following options unlock:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Assign products available in that location</li>
              <li>Add custom SEO metadata (title & description)</li>
              <li>Set location-specific pricing (min/max)</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/services/locations/bulk-upload">
                  <Button className="w-full">Upload Locations (CSV)</Button>
                </Link>
                <Link href="/admin/services/locations/services-map">
                  <Button className="w-full">Services × Locations Mapping</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}

    </div>
  );
}
