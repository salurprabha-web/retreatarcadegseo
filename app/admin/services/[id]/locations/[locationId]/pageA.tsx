"use client";

import Link from "next/link";
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
        Manage products, SEO, and pricing for this service in this specific location.
      </p>

      <div className="space-y-5">

        {/* PRODUCTS */}
        <Link href={`/admin/services/${serviceId}/locations/${locationId}/products`}>
          <Card className="cursor-pointer hover:bg-gray-50 transition">
            <CardHeader>
              <CardTitle>Products Available in This Location</CardTitle>
            </CardHeader>
            <CardContent>
              Assign which products are available for this service in this city.
            </CardContent>
          </Card>
        </Link>

        {/* SEO */}
        <Link href={`/admin/services/${serviceId}/locations/${locationId}/seo`}>
          <Card className="cursor-pointer hover:bg-gray-50 transition">
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              Add location-specific title, description, and schema markup.
            </CardContent>
          </Card>
        </Link>

        {/* PRICING */}
        <Link href={`/admin/services/${serviceId}/locations/${locationId}/pricing`}>
          <Card className="cursor-pointer hover:bg-gray-50 transition">
            <CardHeader>
              <CardTitle>Location-Specific Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              Set minimum, maximum, or fixed pricing for this location.
            </CardContent>
          </Card>
        </Link>

      </div>

      <Link href={`/admin/services/${serviceId}/locations`}>
        <Button variant="outline" className="mt-10">
          ← Back to Locations
        </Button>
      </Link>
    </div>
  );
}
