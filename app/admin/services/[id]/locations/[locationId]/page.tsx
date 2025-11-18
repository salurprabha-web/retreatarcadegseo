"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

export default function LocationDashboardPage({
  params,
}: {
  params: { id: string; locationId: string };
}) {
  const { id: serviceId, locationId } = params;

  const [serviceSlug, setServiceSlug] = useState<string>("");
  const [locationSlug, setLocationSlug] = useState<string>("");

  // 🔥 Fetch slugs so we can generate public URL
  useEffect(() => {
    loadSlugs();
  }, []);

  async function loadSlugs() {
    // Service slug
    const { data: sData } = await supabase
      .from("services")
      .select("slug")
      .eq("id", serviceId)
      .single();

    if (sData?.slug) setServiceSlug(sData.slug);

    // Location slug
    const { data: lData } = await supabase
      .from("locations")
      .select("slug")
      .eq("id", locationId)
      .single();

    if (lData?.slug) setLocationSlug(lData.slug);
  }

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Location Settings</h1>

      <p className="text-gray-600 mb-6">
        Manage products, SEO, and pricing for this service in this specific location.
      </p>

      {/* 🌍 PUBLIC PAGE PREVIEW BUTTON */}
      {serviceSlug && locationSlug && (
        <a
          href={`/services/${serviceSlug}/${locationSlug}`}
          target="_blank"
          className="inline-block mb-6"
        >
          <Button className="bg-green-600 hover:bg-green-700">
            👁️ View Public Page
          </Button>
        </a>
      )}

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
