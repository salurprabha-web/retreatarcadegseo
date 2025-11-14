'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Product = {
  id: string;
  title: string;
  slug: string;
  product_type: "event" | "service";
};

type Location = {
  id: string;
  name: string;
  slug: string;
};

type LocationPage = {
  id: string;
  title: string;
  slug: string;
  product_type: "event" | "service";
  product_id: string;
  location_id: string;
  seo_title?: string;
  seo_description?: string;
  override_price?: number;
  schema_json?: any;
};

export default function AdminLocationPages() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pages, setPages] = useState<LocationPage[]>([]);
  
  // form state
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [schemaJson, setSchemaJson] = useState("");

  async function loadInitial() {
    try {
      const [pRes, lRes, pageRes] = await Promise.all([
        fetch("/api/admin/location-pages?mode=products"),
        fetch("/api/admin/locations"),
        fetch("/api/admin/location-pages?mode=list")
      ]);

      const p = await pRes.json();
      const l = await lRes.json();
      const pg = await pageRes.json();

      setProducts(p.data || []);
      setLocations(l.data || []);
      setPages(pg.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load data");
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  function autoGenerateFields(prod: Product, loc: Location) {
    if (!prod || !loc) return;

    const locationName = loc.name;
    const productTitle = prod.title;

    const defaultTitle = `${productTitle} in ${locationName}`;
    const defaultSlug = `${prod.slug}-${loc.slug}`;

    setTitle(defaultTitle);
    setSlug(defaultSlug.toLowerCase());
    setSeoTitle(`Best ${productTitle} in ${locationName} – Affordable Price`);
    setSeoDescription(`Best ${productTitle} services in ${locationName}. Professional, affordable and available for events.`);
  }

  async function submit(e: any) {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          product_type: products.find((p) => p.id === productId)?.product_type,
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

      toast.success("Location page created");
      loadInitial();

      // reset
      setProductId("");
      setLocationId("");
      setTitle("");
      setSlug("");
      setSeoTitle("");
      setSeoDescription("");
      setOverridePrice("");
      setSchemaJson("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed");
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this location page?")) return;

    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Deleted");
      setPages((x) => x.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Location-Specific Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-6">
            {/* Product select */}
            <div>
              <Label>Product (Event or Service)</Label>
              <select
                className="border p-2 rounded w-full"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const prod = products.find((p) => p.id === e.target.value);
                  const loc = locations.find((l) => l.id === locationId);
                  if (prod && loc) autoGenerateFields(prod, loc);
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

            {/* Location select */}
            <div>
              <Label>Location</Label>
              <select
                className="border p-2 rounded w-full"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  const prod = products.find((p) => p.id === productId);
                  const loc = locations.find((l) => l.id === e.target.value);
                  if (prod && loc) autoGenerateFields(prod, loc);
                }}
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Page Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>

            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>

            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Override Price (optional)</Label>
              <Input
                type="number"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
              />
            </div>

            <div>
              <Label>Schema JSON (optional)</Label>
              <Textarea
                className="font-mono text-sm"
                rows={6}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                placeholder={`{"@context":"https://schema.org"}`}
              />
            </div>

            <Button type="submit">Create Page</Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Location Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 && (
            <p className="text-sm text-gray-500">No location pages yet.</p>
          )}

          <div className="grid gap-3">
            {pages.map((pg) => (
              <div
                key={pg.id}
                className="p-4 rounded border bg-white flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">{pg.title}</p>
                  <p className="text-xs text-gray-500">
                    /{pg.product_type}s/{pg.slug}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePage(pg.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
