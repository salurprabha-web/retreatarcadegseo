// app/admin/location-pages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";

type Location = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  type: "event" | "service";
};

type LocationPage = {
  id: string;
  product_id: string;
  location_id: string;
  title: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
};

export default function LocationPagesAdmin() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locationPages, setLocationPages] = useState<LocationPage[]>([]);

  const [form, setForm] = useState({
    product_id: "",
    location_id: "",
    title: "",
    seo_title: "",
    seo_description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Fetch Locations
      const resLoc = await fetch("/api/admin/locations");
      const jsonLoc = await resLoc.json();
      setLocations(jsonLoc.data || []);

      // Fetch list of all products
      const resProducts = await fetch("/api/admin/products-for-locations");
      const jsonProducts = await resProducts.json();
      setProducts(jsonProducts.data || []);

      // Fetch existing location pages
      const resPages = await fetch("/api/admin/location-pages");
      const jsonPages = await resPages.json();
      setLocationPages(jsonPages.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed loading admin data");
    }
  }

  function buildPageURL(p: LocationPage) {
    const loc = locations.find((l) => l.id === p.location_id);
    const product = products.find((pr) => pr.id === p.product_id);

    if (!loc || !product) return "#";

    const base =
      product.type === "event"
        ? `/events/${product.slug}/${loc.slug}`
        : `/services/${product.slug}/${loc.slug}`;

    return base;
  }

  async function createLocationPage(e: any) {
    e.preventDefault();

    if (!form.product_id || !form.location_id || !form.title) {
      return toast.error("Product, location, and title are required.");
    }

    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (json.error) {
        toast.error(json.error);
        return;
      }

      toast.success("Location page created successfully!");
      setForm({
        product_id: "",
        location_id: "",
        title: "",
        seo_title: "",
        seo_description: "",
      });

      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create page");
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this location page?")) return;

    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.error) return toast.error(json.error);

      toast.success("Location page deleted");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Location-Specific Page</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createLocationPage} className="space-y-4">

            {/* Select Product */}
            <div>
              <Label>Select Product</Label>
              <select
                className="w-full border p-2 rounded"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Location */}
            <div>
              <Label>Select Location</Label>
              <select
                className="w-full border p-2 rounded"
                value={form.location_id}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <Label>Page Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="AI Photobooth Rental in Hyderabad"
              />
            </div>

            {/* SEO Title */}
            <div>
              <Label>SEO Title</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder="Best AI Photobooth Rental in Hyderabad"
              />
            </div>

            {/* SEO Description */}
            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={form.seo_description}
                onChange={(e) =>
                  setForm({ ...form, seo_description: e.target.value })
                }
                placeholder="Hire the best AI photobooth in Hyderabad..."
              />
            </div>

            <Button type="submit" className="w-full">
              Create Page
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
          <div className="space-y-4">
            {locationPages.length === 0 && (
              <p className="text-gray-500">No location pages created yet.</p>
            )}

            {locationPages.map((p) => {
              const url = buildPageURL(p);
              return (
                <div
                  key={p.id}
                  className="p-4 border rounded flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.slug}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={url}
                      className="text-blue-600 underline text-sm"
                      target="_blank"
                    >
                      Visit page
                    </Link>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePage(p.id)}
                    >
                      Delete
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
