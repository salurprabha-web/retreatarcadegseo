"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function ProductsLocationPage({
  params,
}: {
  params: { id: string; locationId: string };
}) {
  const router = useRouter();
  const { id: serviceId, locationId } = params;

  const [products, setProducts] = useState<Product[]>([]);
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // 1️⃣ Load all products
    const response = await fetch("/api/admin/get-products");
    const result = await response.json();

    if (!response.ok) {
      console.error(result);
      toast.error("Failed to load products");
      setLoading(false);
      return;
    }

    setProducts(result.products || []);

    // 2️⃣ Load assigned product rows
    const { data: rows, error } = await supabase
      .from("service_location_products")
      .select("product_id, is_enabled")
      .eq("service_id", serviceId)
      .eq("location_id", locationId);

    if (error) {
      console.error("Assigned Fetch Error:", error);
      toast.error("Failed to load assigned products");
      setLoading(false);
      return;
    }

    const map: Record<string, boolean> = {};
    rows?.forEach((r) => {
      map[r.product_id] = !!r.is_enabled;
    });

    setAssigned(map);
    setLoading(false);
  }

  async function saveAssignments() {
    setSaving(true);

    const updates = products.map((p) => ({
      service_id: serviceId,
      location_id: locationId,
      product_id: p.id,
      is_enabled: !!assigned[p.id],
    }));

    const res = await fetch("/api/admin/save-product-locations", {
      method: "POST",
      body: JSON.stringify({ rows: updates }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Save Error", result);
      toast.error("Failed to save product assignments");
    } else {
      toast.success("Products updated successfully");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="p-6 text-lg">Loading products...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Products for This Location</h1>

      <Link href={`/admin/services/${serviceId}/locations/${locationId}`}>
        <Button variant="outline" className="mb-6">
          ← Back to Location
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Available Products</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.slug}</p>
                </div>

                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={assigned[p.id] || false}
                  onChange={(e) =>
                    setAssigned((prev) => ({
                      ...prev,
                      [p.id]: e.target.checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <Button
            onClick={saveAssignments}
            className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
