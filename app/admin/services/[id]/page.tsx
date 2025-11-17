"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">
        {service.title}
      </h1>

      {/* GRID SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        {/* EDIT SERVICE */}
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

        {/* MANAGE LOCATIONS */}
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

      {/* LOCATION LEVEL FEATURES */}
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

      {/* BULK + DASHBOARD TOOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Bulk Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <Link href="/admin/services/locations/bulk-upload">
              <Button className="w-full">
                Upload Locations (CSV)
              </Button>
            </Link>

            <Link href="/admin/services/locations/services-map">
              <Button className="w-full">
                Services × Locations Mapping
              </Button>
            </Link>

          </CardContent>
        </Card>

      </div>

    </div>
  );
}
