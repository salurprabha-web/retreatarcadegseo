"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Location = { id: string; city: string; slug: string };
type Product = { id: string; title: string; slug: string };
type PageItem = any;

export default function AdminLocationPages() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [events, setEvents] = useState<Product[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedProductType, setSelectedProductType] = useState<"service" | "event">("service");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedLocationsList, setSelectedLocationsList] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [loc, svc, evt, lp] = await Promise.all([
        fetch("/api/admin/locations").then(r=>r.json()),
        fetch("/api/admin/services?all=true").then(r=>r.json()).catch(()=>({data:[]})),
        fetch("/api/admin/events?all=true").then(r=>r.json()).catch(()=>({data:[]})),
        fetch("/api/admin/location-pages").then(r=>r.json()),
      ]);

      setLocations(loc.data || []);
      setServices(svc.data || []);
      setEvents(evt.data || []);
      setPages(lp.data || []);

    } catch (err:any) {
      console.error(err);
      toast.error("Failed loading admin data");
    }
    setLoading(false);
  }

  const products = selectedProductType === "service" ? services : events;

  function toggleProduct(id: string) {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleLocation(id: string) {
    setSelectedLocationsList(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function bulkGenerate() {
    if (selectedProducts.length === 0) return toast.error("Select at least one product");
    if (selectedLocationsList.length === 0) return toast.error("Select at least one location");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          bulk: true,
          product_type: selectedProductType,
          products: selectedProducts,
          locations: selectedLocationsList
        })
      });

      const json = await res.json();
      if (res.status >= 400) throw new Error(json.error);

      toast.success(`Generated ${json.created?.length || 0} pages`);
      loadAll();
    } catch (err:any) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  function buildURL(p: any) {
    const locSlug = p.locations?.slug || "";
    const productSlug =
      p.product_type === "service"
        ? p.services?.slug
        : p.events?.slug;

    if (!productSlug || !locSlug) return "#";

    return `https://www.retreatarcade.in/${p.product_type === "service" ? "services" : "events"}/${productSlug}/${locSlug}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ------------------------------ */}
        {/* PRODUCT + LOCATION SELECTORS   */}
        {/* ------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Create Location Pages (Bulk or Single)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            <div>
              <Label>Product Type</Label>
              <select
                className="w-full mt-1"
                value={selectedProductType}
                onChange={e => {
                  setSelectedProductType(e.target.value as any);
                  setSelectedProducts([]);
                }}
              >
                <option value="service">Service</option>
                <option value="event">Event</option>
              </select>
            </div>

            {/* PRODUCTS */}
            <div>
              <Label>Select Products</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`p-3 border rounded ${
                      selectedProducts.includes(p.id)
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* LOCATIONS */}
            <div>
              <Label>Select Locations</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {locations.map(l => (
                  <button
                    key={l.id}
                    onClick={() => toggleLocation(l.id)}
                    className={`p-3 border rounded ${
                      selectedLocationsList.includes(l.id)
                        ? "bg-green-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {l.city}
                  </button>
                ))}
              </div>
            </div>

            <Button disabled={loading} onClick={bulkGenerate}>
              {loading ? "Generating..." : "Generate Pages"}
            </Button>
          </CardContent>
        </Card>

        {/* ------------------------------ */}
        {/* EXISTING PAGES LIST            */}
        {/* ------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Location Pages</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {pages.length === 0 && (
              <p className="text-gray-500">No location pages yet.</p>
            )}

            {pages.map((p: any) => {
              const url = buildURL(p);

              return (
                <div
                  key={p.id}
                  className="p-4 bg-white rounded-lg border shadow-sm flex justify-between items-start"
                >
                  <div>
                    <p className="text-xs text-gray-500">
                      {p.product_type.toUpperCase()}
                    </p>
                    <p className="font-semibold">{p.title}</p>

                    <p className="text-xs text-gray-400">
                      {p.product_type === "service"
                        ? p.services?.title
                        : p.events?.title}{" "}
                      · {p.locations?.city}
                    </p>

                    <div className="flex gap-4 mt-2">
                      <Link
                        href={url}
                        target="_blank"
                        className="text-blue-600 underline text-sm"
                      >
                        Preview
                      </Link>

                      <button
                        onClick={() => {
                          setEditing(p);
                          setTitle(p.title);
                          setSeoTitle(p.seo_title || "");
                          setSeoDesc(p.seo_description || "");
                        }}
                        className="text-sm text-gray-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={async () => {
                          if (!confirm("Delete?")) return;
                          await fetch(`/api/admin/location-pages?id=${p.id}`, { method:"DELETE" });
                          toast.success("Deleted");
                          loadAll();
                        }}
                        className="text-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ------------------------------ */}
        {/* EDIT PANEL                     */}
        {/* ------------------------------ */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} />
              </div>

              <div>
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} />
              </div>

              <div>
                <Label>SEO Description</Label>
                <Input value={seoDesc} onChange={(e)=>setSeoDesc(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={async () => {
                    const res = await fetch("/api/admin/location-pages", {
                      method:"PUT",
                      headers:{ "Content-Type":"application/json" },
                      body: JSON.stringify({
                        id: editing.id,
                        title,
                        seo_title: seoTitle,
                        seo_description: seoDesc
                      })
                    });
                    const j = await res.json();
                    if (res.status >= 400) toast.error(j.error);
                    else {
                      toast.success("Updated");
                      setEditing(null);
                      loadAll();
                    }
                  }}
                >
                  Save
                </Button>

                <Button variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
