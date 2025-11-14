// app/admin/location-pages/page.tsx
'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Location = {
  id: string;
  city: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  product_type: "service" | "event";
};

type LocationPage = {
  id: string;
  title: string;
  slug: string;
  product_type: "service" | "event";
  location_name: string;
};

export default function AdminLocationPages() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pages, setPages] = useState<LocationPage[]>([]);

  // Form Fields
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // ------------------------------------------
  // LOAD INITIAL DATA
  // ------------------------------------------
  useEffect(() => {
    fetch("/api/admin/location-pages")
      .then((r) => r.json())
      .then((json) => setPages(json.data || []));

    fetch("/api/admin/locations")
      .then((r) => r.json())
      .then((json) => setLocations(json.data || []));

    fetch("/api/admin/products-for-locations") // NEW ENDPOINT
      .then((r) => r.json())
      .then((json) => setProducts(json.data || []));
  }, []);

  // ------------------------------------------
  // AUTO GENERATE TITLE & SEO FIELDS
  // ------------------------------------------
  function autoGenerateFields(pid: string, lid: string) {
    const p = products.find((x) => x.id === pid);
    const l = locations.find((x) => x.id === lid);
    if (!p || !l) return;

    const locationName = l.city;
    const newTitle = `${p.title} in ${locationName}`;
    const newSeoTitle = `Best ${p.title} in ${locationName} – Affordable Pricing`;
    const newSeoDesc = `Hire ${p.title.toLowerCase()} in ${locationName}. High-quality, affordable, and professional service for events.`;

    setTitle(newTitle);
    setSeoTitle(newSeoTitle);
    setSeoDesc(newSeoDesc);
  }

  // ------------------------------------------
  // CREATE PAGE
  // ------------------------------------------
  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!productId || !locationId) {
      toast.error("Select product & location");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          title,
          seo_title: seoTitle,
          seo_description: seoDesc
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Location page created!");

      // Refresh list
      fetch("/api/admin/location-pages")
        .then((r) => r.json())
        .then((json) => setPages(json.data || []));
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------------
  // DELETE PAGE
  // ------------------------------------------
  async function handleDelete(id: string) {
    if (!confirm("Delete location page?")) return;

    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Deleted!");
      setPages((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  }

  // ------------------------------------------
  // RENDER UI
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* CREATE FORM */}
        <Card>
          <CardHeader>
            <CardTitle>Create Location-Specific Page</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {/* Product */}
              <div>
                <Label>Product</Label>
                <select
                  className="border rounded-md p-2 w-full"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    autoGenerateFields(e.target.value, locationId);
                  }}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.product_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <Label>Location</Label>
                <select
                  className="border rounded-md p-2 w-full"
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    autoGenerateFields(productId, e.target.value);
                  }}
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <Label>Page Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="AI Photobooth in Hyderabad"
                />
              </div>

              {/* SEO Title */}
              <div>
                <Label>SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
              </div>

              {/* SEO Description */}
              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                />
              </div>

              <Button className="mt-2" disabled={saving}>
                {saving ? "Saving..." : "Create Page"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LIST OF EXISTING PAGES */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Location Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length === 0 && (
              <p className="text-gray-500 text-sm">No pages created yet.</p>
            )}

            <div className="space-y-3">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
                >
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-gray-500">
                      {p.product_type} → {p.location_name}
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
