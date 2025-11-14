"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LocationPagesAdmin() {
  const [pages, setPages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadPages();
    loadLocations();
    loadProducts();
  }, []);

  async function loadPages() {
    try {
      const res = await fetch("/api/admin/location-pages");
      const json = await res.json();
      setPages(json.data || []);
    } catch (err) {
      toast.error("Failed to load pages");
    }
  }

  async function loadLocations() {
    const res = await fetch("/api/admin/locations");
    const json = await res.json();
    setLocations(json.data || []);
  }

  async function loadProducts() {
    const res = await fetch("/api/admin/products-for-locations");
    const json = await res.json();
    setProducts(json.data || []);
  }

  function autoGenerateSEO(selectedProduct: any, selectedLocation: any) {
    if (!selectedProduct || !selectedLocation) return;
    const pname = selectedProduct.title;
    const lname = selectedLocation.name;

    const t = `${pname} in ${lname}`;
    const st = `Best ${pname} in ${lname} – Affordable Pricing`;
    const sd = `Hire ${pname} in ${lname}. High-quality, affordable, and professional service for weddings, corporates, and all events.`;

    setTitle(t);
    setSeoTitle(st);
    setSeoDesc(sd);
  }

  async function handleCreate(e: any) {
    e.preventDefault();
    if (!productId || !locationId || !title) {
      toast.error("Select product, location, and title");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/location-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        location_id: locationId,
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
      }),
    });

    const json = await res.json();

    if (json.error) {
      toast.error(json.error);
      setLoading(false);
      return;
    }

    toast.success("Location page created!");
    setLoading(false);
    loadPages();
    setTitle("");
    setSeoTitle("");
    setSeoDesc("");
    setProductId("");
    setLocationId("");
  }

  function buildPageURL(p: any) {
    const loc = locations.find((l) => l.id === p.location_id);
    const product = products.find((pr) => pr.id === p.product_id);

    if (!loc || !product) return "#";

    if (p.product_type === "event") {
      return `/events/${product.slug}/${loc.slug}`;
    } else {
      return `/services/${product.slug}/${loc.slug}`;
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this page?")) return;

    const res = await fetch(`/api/admin/location-pages?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (json.error) return toast.error(json.error);

    toast.success("Deleted!");
    loadPages();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Location-Specific Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">

            {/* Product select */}
            <div>
              <Label>Select Product</Label>
              <select
                className="w-full p-2 border rounded"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const prod = products.find((p) => p.id === e.target.value);
                  const loc = locations.find((l) => l.id === locationId);
                  autoGenerateSEO(prod, loc);
                }}
              >
                <option value="">Select product</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Location select */}
            <div>
              <Label>Select Location</Label>
              <select
                className="w-full p-2 border rounded"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  const prod = products.find((p) => p.id === productId);
                  const loc = locations.find((l) => l.id === e.target.value);
                  autoGenerateSEO(prod, loc);
                }}
              >
                <option value="">Select location</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <Label>Location Page Title</Label>
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
              <textarea
                className="w-full border p-2 rounded"
                rows={3}
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Page"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing pages */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Location Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 && <p>No pages yet.</p>}

          <div className="space-y-3">
            {pages.map((p: any) => (
              <div
                key={p.id}
                className="p-3 border rounded flex justify-between bg-white"
              >
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="text-sm text-gray-600">
                    {p.product_title} — {p.location_name}
                  </p>

                  <a
                    href={buildPageURL(p)}
                    className="text-blue-600 underline text-sm"
                    target="_blank"
                  >
                    Visit Page
                  </a>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => deletePage(p.id)}
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
