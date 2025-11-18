"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LocationProductsPage({ params }: any) {
  const serviceId = params.id;
  const locationId = params.locationId;

  const [products, setProducts] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    // 1️⃣ Load all products
    const { data: allProducts, error: pErr } = await supabase
      .from("events")
      .select("id, title, slug, price, status")
      .order("title", { ascending: true });

    if (pErr) {
      console.error("PRODUCT FETCH ERROR:", pErr);
      toast.error("Failed to load products");
      return;
    }

    setProducts(allProducts || []);

    // 2️⃣ Load assigned service-location products
    const { data: assignedRows, error: aErr } = await supabase
      .from("service_location_products")
      .select("product_id, is_enabled")
      .eq("service_id", serviceId)
      .eq("location_id", locationId);

    if (aErr) {
      console.error("ASSIGNED FETCH ERROR:", aErr);
      toast.error("Failed to load assigned products");
      return;
    }

    const map: Record<string, boolean> = {};
    assignedRows?.forEach((r: any) => {
      map[r.product_id] = !!r.is_enabled;
    });

    setAssigned(map);
    setLoading(false);
  }

  async function saveAssignments() {
    setSaving(true);

    const payload = {
      service_id: serviceId,
      location_id: locationId,
      products: products.map((p) => ({
        id: p.id,
        enabled: assigned[p.id] || false,
      })),
    };

    console.log("📤 SENDING PAYLOAD:", payload);

    const res = await fetch("/api/admin/save-location-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Save error:", data);
      toast.error("Failed to update products");
      setSaving(false);
      return;
    }

    toast.success("Products updated successfully");
    setSaving(false);
  }

  if (loading) {
    return <div className="p-10 text-center text-lg">Loading products...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-6">
        Products Available in This Location
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Assign Products</CardTitle>
        </CardHeader>

        <CardContent>
          {products.length === 0 && (
            <p className="text-gray-500">No products available</p>
          )}

          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.slug}</p>
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
            disabled={saving}
            className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
