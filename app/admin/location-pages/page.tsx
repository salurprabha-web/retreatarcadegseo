"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { buildCanonical } from "@/lib/canonical";

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
  seo_title: string | null;
  seo_description: string | null;
  canonical: string | null;
  schema_json: any;
};

export default function LocationPagesAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pages, setPages] = useState<LocationPage[]>([]);

  // Form fields
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [canonical, setCanonical] = useState("");
  const [schema, setSchema] = useState("");

  // Edit mode
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [prodRes, locRes, pageRes] = await Promise.all([
      fetch("/api/admin/products-for-locations"),
      fetch("/api/admin/locations"),
      fetch("/api/admin/location-pages")
    ]);

    const prodJson = await prodRes.json();
    const locJson = await locRes.json();
    const pageJson = await pageRes.json();

    setProducts(prodJson.data || []);
    setLocations(locJson.data || []);
    setPages(pageJson.data || []);
  }

  // Auto-generate when product or location changes (only in create mode)
  useEffect(() => {
    if (editId) return; // ❌ no auto-fill in edit mode

    const product = products.find((p) => p.id === selectedProduct);
    const location = locations.find((l) => l.id === selectedLocation);

    if (!product || !location) return;

    const newTitle = `${product.title} in ${location.name}`;
    setTitle(newTitle);

    setSeoTitle(`Best ${product.title} in ${location.name} – Affordable Pricing`);
    setSeoDesc(
      `Hire ${product.title} in ${location.name}. High-quality, affordable, professional service for weddings, corporate events, and parties.`
    );

    const canonicalURL = buildCanonical(
      product.product_type,
      product.slug,
      location.slug
    );
    setCanonical(canonicalURL);

    const schemaObj = {
      "@context": "https://schema.org",
      "@type": product.product_type === "event" ? "Event" : "Service",
      name: newTitle,
      description: seoDesc,
      url: canonicalURL,
      areaServed: { "@type": "City", name: location.name },
      provider: {
        "@type": "Organization",
        name: "Retreat Arcade Events",
        url: "https://www.retreatarcade.in",
      },
    };

    setSchema(JSON.stringify(schemaObj, null, 2));
  }, [selectedProduct, selectedLocation]);

  // -----------------------------
  // CREATE NEW
  // -----------------------------
  async function createPage(e: any) {
    e.preventDefault();

    const res = await fetch("/api/admin/location-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct,
        location_id: selectedLocation,
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        canonical,
        schema_json: JSON.parse(schema),
      }),
    });

    const json = await res.json();
    if (json.error) return toast.error(json.error);

    toast.success("Location page created!");
    resetForm();
    loadData();
  }

  // -----------------------------
  // LOAD INTO EDIT MODE
  // -----------------------------
  function startEdit(page: LocationPage) {
    setEditId(page.id);

    setSelectedProduct(page.product_id);
    setSelectedLocation(page.location_id);
    setTitle(page.title);
    setSeoTitle(page.seo_title || "");
    setSeoDesc(page.seo_description || "");
    setCanonical(page.canonical || "");
    setSchema(JSON.stringify(page.schema_json || {}, null, 2));
  }

  // -----------------------------
  // UPDATE EXISTING
  // -----------------------------
  async function updatePage(e: any) {
    e.preventDefault();

    const res = await fetch("/api/admin/location-pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        canonical,
        schema_json: JSON.parse(schema),
      }),
    });

    const json = await res.json();
    if (json.error) return toast.error(json.error);

    toast.success("Location page updated");
    resetForm();
    loadData();
  }

  // Reset form & exit edit mode
  function resetForm() {
    setEditId(null);
    setSelectedProduct("");
    setSelectedLocation("");
    setTitle("");
    setSeoTitle("");
    setSeoDesc("");
    setCanonical("");
    setSchema("");
  }

  function buildPageURL(page: LocationPage) {
    const product = products.find((p) => p.id === page.product_id);
    const location = locations.find((l) => l.id === page.location_id);

    if (!product || !location) return "#";

    return `/${page.product_type}s/${product.slug}/${location.slug}`;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {editId ? "Edit Location-Specific Page" : "Create Location-Specific Page"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={editId ? updatePage : createPage} className="grid grid-cols-1 gap-4">

            {/* Product */}
            <div>
              <Label>Product</Label>
              <select
                className="border p-2 w-full rounded"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                disabled={!!editId}
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
                className="border p-2 w-full rounded"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={!!editId}
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {/* SEO Title */}
            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>

            {/* SEO Description */}
            <div>
              <Label>SEO Description</Label>
              <Input
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
              />
            </div>

            {/* Canonical */}
            <div>
              <Label>Canonical URL</Label>
              <Input value={canonical} onChange={(e) => setCanonical(e.target.value)} />
            </div>

            {/* Schema */}
            <div>
              <Label>JSON-LD Schema</Label>
              <textarea
                className="border p-3 w-full rounded font-mono text-sm h-40"
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">
                {editId ? "Save Changes" : "Create Page"}
              </Button>

              {editId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
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

          <div className="space-y-4">
            {pages.map((p) => {
              const url = buildPageURL(p);

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">{url}</p>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={url}
                      className="text-blue-600 underline text-sm"
                      target="_blank"
                    >
                      Preview
                    </Link>

                    <Button size="sm" onClick={() => startEdit(p)}>
                      Edit
                    </Button>

                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
