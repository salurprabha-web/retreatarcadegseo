"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// TYPES
type Product = {
  id: string;
  title: string;
  type: "event" | "service";
};

type Location = {
  id: string;
  name: string;
  slug: string;
};

export default function CreateLocationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [overridePrice, setOverridePrice] = useState("");
  const [schemaJson, setSchemaJson] = useState("{}");

  const [saving, setSaving] = useState(false);

  // Load products + locations
  useEffect(() => {
    loadProducts();
    loadLocations();
  }, []);

  // FIX: always hit correct API path
  async function loadProducts() {
    try {
      const res = await fetch(`${window.location.origin}/api/admin/products-for-locations`);
      const json = await res.json();
      setProducts(json.data || []);
    } catch (err) {
      toast.error("Failed to load products");
    }
  }

  async function loadLocations() {
    try {
      const res = await fetch(`${window.location.origin}/api/admin/locations`);
      const json = await res.json();
      setLocations(json.data || []);
    } catch (err) {
      toast.error("Failed to load locations");
    }
  }

  // Auto-generate title/slug/SEO when selection changes
  useEffect(() => {
    if (!productId || !locationId) return;

    const prod = products.find((p) => p.id === productId);
    const loc = locations.find((l) => l.id === locationId);
    if (!prod || !loc) return;

    const cleanTitle = `${prod.title} in ${loc.name}`;
    const cleanSlug = `${prod.title.toLowerCase().replace(/\s+/g, "-")}-${loc.slug}`
      .replace(/[^a-z0-9-]/g, "");

    setTitle(cleanTitle);
    setSlug(cleanSlug);
    setSeoTitle(`Best ${prod.title} in ${loc.name} – Affordable Pricing`);

    setSeoDescription(
      `Hire ${prod.title} in ${loc.name}. High-quality, professional service for weddings, corporates & events.`
    );
  }, [productId, locationId]);

  async function createPage(e: any) {
    e.preventDefault();

    if (!productId || !locationId) {
      toast.error("Choose product and location");
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
          slug,
          seo_title: seoTitle,
          seo_description: seoDescription,
          override_price: overridePrice ? Number(overridePrice) : null,
          schema_json: schemaJson ? JSON.parse(schemaJson) : null,
        }),
      });

      const json = await res.json();

      if (json.error) throw new Error(json.error);

      toast.success("Location page created!");

      // Reset form
      setProductId("");
      setLocationId("");
      setTitle("");
      setSlug("");
      setSeoTitle("");
      setSeoDescription("");
      setOverridePrice("");
      setSchemaJson("{}");
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Location-Specific Page</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={createPage} className="space-y-6">

              {/* PRODUCT SELECT */}
              <div>
                <Label>Select Product</Label>
                <select
                  className="mt-2 w-full border px-3 py-2 rounded"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select product</option>

                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* LOCATION SELECT */}
              <div>
                <Label>Select Location</Label>
                <select
                  className="mt-2 w-full border px-3 py-2 rounded"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">Select location</option>

                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TITLE */}
              <div>
                <Label>Page Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* SLUG */}
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>

              {/* SEO TITLE */}
              <div>
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>

              {/* SEO DESCRIPTION */}
              <div>
                <Label>SEO Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
              </div>

              {/* OPTIONAL PRICE */}
              <div>
                <Label>Override Price (Optional)</Label>
                <Input
                  type="number"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                />
              </div>

              {/* JSON SCHEMA */}
              <div>
                <Label>Custom Schema JSON (Optional)</Label>
                <Textarea
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  rows={6}
                />
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Location Page"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
