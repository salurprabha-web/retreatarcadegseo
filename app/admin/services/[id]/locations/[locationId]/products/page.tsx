"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

type AssignedRow = {
  product_id: string;
  is_enabled: boolean;
};

export default function ProductsPage({
  params,
}: {
  params: { id: string; locationId: string };
}) {
  const router = useRouter();
  const serviceId = params.id;
  const locationId = params.locationId;

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Load products (events table)
    const { data: productsData, error: prodErr } = await supabase
      .from("events")
      .select("id, title, slug, status")
      .order("title", { ascending: true });

    if (prodErr) {
      console.error("Product fetch error:", prodErr);
      toast.error("Failed to load products");
      return;
    }

    setProducts(productsData || []);

    // Load assigned product rows
    const { data: assignedRows, error: assignErr } = await supabase
      .from("service_location_products")
      .select("product_id, is_enabled")
      .eq("service_id", serviceId)
      .eq("location_id", locationId);

    if (assignErr) {
      console.error("Assigned fetch error:", assignErr);
      toast.error("Failed to load assigned products");
      return;
    }

    const map: Record<string, boolean> = {};
    assignedRows?.forEach((r: AssignedRow) => {
      map[r.product_id] = !!r.is_enabled;
    });

    setAssigned(map);
    setLoading(false);
  }

  async function saveAssignments() {
    setSaving(true);

    try {
      const updates = products.map((p) => ({
        service_id: serviceId,
        location_id: locationId,
        product_id: p.id,
        is_enabled: !!assigned[p.id],
      }));

      const res = await fetch("/api/admin/save-location-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: updates }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Save error:", result);
        toast.error("Failed to update products");
      } else {
        toast.success("Products updated successfully");
      }
    } catch (err) {
      console.error("Save exception:", err);
      toast.error("Error updating products");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="p-10 text-center text-lg">Loading products...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">
        Products Available in This Location
      </h1>
      <p className="text-gray-600 mb-4">
        Assign which products (event packages) are available for this service in
        this city.
      </p>

      <Link href={`/admin/services/${serviceId}/locations/${locationId}`}>
        <Button variant="outline" className="mb-6">
          ← Back to Location
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">
                    {p.slug} | Status: {p.status}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={assigned[p.id] || false}
                  onChange={(e) =>
                    setAssigned((prev) => ({
                      ...prev,
                      [p.id]: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={saveAssignments}
            className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
