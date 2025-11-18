"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LocationDashboardPage({
  params,
}: {
  params: { id: string; locationId: string };
}) {
  const { id: serviceId, locationId } = params;

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Location Settings</h1>

      <p className="text-gray-600 mb-6">
        Manage products, SEO, and pricing for this service in this location.
      </p>

      <div className="space-y-4">

        <Link href={`/admin/services/${serviceId}/locations/${locationId}/products`}>
          <Card className="cursor-pointer hover:bg-gray-50">
            <CardHeader>
              <CardTitle>Products for This Location</CardTitle>
            </CardHeader>
            <CardContent>
              Assign or remove products available in this location.
            </CardContent>
          </Card>
        </Link>

        <Link href={`/admin/services/${serviceId}/locations/${locationId}/seo`}>
          <Card className="cursor-pointer hover:bg-gray-50">
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              Set location-specific title, description, and schema.
            </CardContent>
          </Card>
        </Link>

        <Link href={`/admin/services/${serviceId}/locations/${locationId}/pricing`}>
          <Card className="cursor-pointer hover:bg-gray-50">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              Set minimum & maximum price for this location.
            </CardContent>
          </Card>
        </Link>

      </div>

      <Link href={`/admin/services/${serviceId}/locations`}>
        <Button variant="outline" className="mt-8">
          ← Back to Locations
        </Button>
      </Link>
    </div>
  );
}
