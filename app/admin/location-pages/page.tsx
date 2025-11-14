"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Admin Location Pages — Enhanced
 * - Delete
 * - Search + Pagination
 * - Product image + Location badge in list
 * - Duplicate page
 * - Live preview (JSON-LD + OG + canonical)
 *
 * Paste into: app/admin/location-pages/page.tsx
 */

// ----- Types -----
type Product = {
  id: string;
  title: string;
  slug: string;
  product_type: "event" | "service";
  image_url?: string | null;
};

type Location = {
  id: string;
  name: string;
  slug: string;
};

type LocationPage = {
  id: string;
  title: string;
  slug?: string;
  product_type: "event" | "service";
  product_id: string;
  location_id: string;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical?: string | null;
  schema_json?: any;
  created_at?: string;
};

// ----- Helpers -----
function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function buildCanonical(productType: string, productSlug: string, locationSlug: string) {
  const base = "https://www.retreatarcade.in";
  const prefix = productType === "event" ? "events" : "services";
  return `${base}/${prefix}/${productSlug}/${locationSlug}`;
}

// ----- Component -----
export default function AdminLocationPages() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pages, setPages] = useState<LocationPage[]>([]);

  // Form
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [seoTitle, setSeoTitle] = useState<string>("");
  const [seoDesc, setSeoDesc] = useState<string>("");
  const [canonical, setCanonical] = useState<string>("");
  const [schemaText, setSchemaText] = useState<string>("{}");

  // UI
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Search + Pagination
  const [query, setQuery] = useState("");
  const [pageIdx, setPageIdx] = useState(1);
  const pageSize = 8;

  // Fetch initial data
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [pRes, lRes, pagesRes] = await Promise.all([
        fetch("/api/admin/products-for-locations"),
        fetch("/api/admin/locations"),
        fetch("/api/admin/location-pages"),
      ]);

      const pJson = await pRes.json();
      const lJson = await lRes.json();
      const pagesJson = await pagesRes.json();

      setProducts(pJson.data || []);
      setLocations(lJson.data || []);
      setPages(pagesJson.data || []);
    } catch (err) {
      console.error("loadAll", err);
      toast.error("Failed to load admin data");
    }
  }

  // Auto-fill (create mode only)
  useEffect(() => {
    if (editId) return; // don't auto-change during edit
    const p = products.find((x) => x.id === selectedProduct);
    const l = locations.find((x) => x.id === selectedLocation);
    if (!p || !l) return;

    const newTitle = `${p.title} in ${l.name}`;
    const ogTitle = `Best ${p.title} in ${l.name} – Affordable Pricing`;
    const ogDesc = `Hire ${p.title} in ${l.name}. High-quality, affordable, and professional service for events and celebrations.`;

    setTitle(newTitle);
    setSeoTitle(ogTitle);
    setSeoDesc(ogDesc);
    setCanonical(buildCanonical(p.product_type, p.slug, l.slug));

    const schemaObj = {
      "@context": "https://schema.org",
      "@type": p.product_type === "event" ? "Event" : "Service",
      name: newTitle,
      description: ogDesc,
      url: buildCanonical(p.product_type, p.slug, l.slug),
      provider: {
        "@type": "Organization",
        name: "Retreat Arcade",
        url: "https://www.retreatarcade.in",
      },
      areaServed: { "@type": "City", name: l.name },
    };

    setSchemaText(JSON.stringify(schemaObj, null, 2));
  }, [selectedProduct, selectedLocation, products, locations, editId]);

  // ----- Create -----
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !selectedLocation || !title) {
      toast.error("Choose product, location and title");
      return;
    }
    setLoading(true);
    try {
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
          schema_json: JSON.parse(schemaText || "{}"),
        }),
      });
      const json = await res.json();
      if (res.status >= 400) {
        console.error("create error", json);
        toast.error(json.error || "Create failed");
      } else {
        toast.success("Location page created");
        await loadAll();
        resetForm();
      }
    } catch (err: any) {
      console.error("create", err);
      toast.error(err.message || "Create failed");
    } finally {
      setLoading(false);
    }
  }

  // ----- Edit Mode -----
  function enterEdit(page: LocationPage) {
    setEditId(page.id);
    setSelectedProduct(page.product_id);
    setSelectedLocation(page.location_id);
    setTitle(page.title || "");
    setSeoTitle(page.seo_title || "");
    setSeoDesc(page.seo_description || "");
    setCanonical(page.canonical || "");
    setSchemaText(JSON.stringify(page.schema_json || {}, null, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          title,
          seo_title: seoTitle,
          seo_description: seoDesc,
          canonical,
          schema_json: JSON.parse(schemaText || "{}"),
        }),
      });
      const json = await res.json();
      if (res.status >= 400) {
        console.error("update error", json);
        toast.error(json.error || "Update failed");
      } else {
        toast.success("Updated");
        await loadAll();
        clearEdit();
      }
    } catch (err: any) {
      console.error("update", err);
      toast.error(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  function clearEdit() {
    setEditId(null);
    setSelectedProduct("");
    setSelectedLocation("");
    setTitle("");
    setSeoTitle("");
    setSeoDesc("");
    setCanonical("");
    setSchemaText("{}");
  }

  // ----- Delete -----
  async function handleDelete(id: string) {
    if (!confirm("Delete this location page?")) return;
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.status >= 400) {
        console.error("delete error", json);
        toast.error(json.error || "Delete failed");
      } else {
        toast.success("Deleted");
        setPages((s) => s.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("delete", err);
      toast.error("Delete failed");
    }
  }

  // ----- Duplicate -----
  async function handleDuplicate(page: LocationPage) {
    if (!confirm(`Duplicate "${page.title}"?`)) return;
    try {
      const product = products.find((p) => p.id === page.product_id);
      const location = locations.find((l) => l.id === page.location_id);
      const newTitle = `${page.title} (Copy)`;
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: page.product_id,
          location_id: page.location_id,
          title: newTitle,
          seo_title: page.seo_title ? `${page.seo_title} (Copy)` : undefined,
          seo_description: page.seo_description,
          canonical: page.canonical ? page.canonical.replace(/\/$/, "") + "-copy" : undefined,
          schema_json: page.schema_json || {},
        }),
      });
      const json = await res.json();
      if (res.status >= 400) {
        console.error("duplicate err", json);
        toast.error(json.error || "Duplicate failed");
      } else {
        toast.success("Duplicated");
        await loadAll();
      }
    } catch (err) {
      console.error("duplicate", err);
      toast.error("Duplicate failed");
    }
  }

  // ----- Search & Pagination logic -----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => {
      const prod = products.find((x) => x.id === p.product_id);
      const loc = locations.find((x) => x.id === p.location_id);
      return (
        p.title?.toLowerCase().includes(q) ||
        (p.seo_title || "").toLowerCase().includes(q) ||
        (prod?.title || "").toLowerCase().includes(q) ||
        (loc?.name || "").toLowerCase().includes(q)
      );
    });
  }, [pages, query, products, locations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (pageIdx > totalPages) setPageIdx(1);
  }, [totalPages]);

  const visiblePages = filtered.slice((pageIdx - 1) * pageSize, pageIdx * pageSize);

  // ----- Build preview data for currently editing/creating page -----
  const previewProduct = products.find((p) => p.id === (editId ? selectedProduct : selectedProduct));
  const previewLocation = locations.find((l) => l.id === selectedLocation);

  let parsedSchema: any = null;
  try {
    parsedSchema = JSON.parse(schemaText || "{}");
  } catch {
    parsedSchema = null;
  }

  // ----- Render -----
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editId ? "Edit Location Page" : "Create Location Page"}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={editId ? handleUpdate : handleCreate} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {/* Product */}
              <div>
                <Label>Product</Label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  disabled={!!editId}
                >
                  <option value="">-- select product --</option>
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
                  className="w-full border rounded p-2"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={!!editId}
                >
                  <option value="">-- select location --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>SEO Description</Label>
                <Input value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Canonical URL</Label>
                <Input value={canonical} onChange={(e) => setCanonical(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>JSON-LD Schema (editable)</Label>
                <textarea
                  className="w-full border rounded p-2 font-mono text-sm h-40"
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 items-center">
                <Button type="submit" disabled={loading}>
                  {editId ? (loading ? "Saving..." : "Save Changes") : (loading ? "Creating..." : "Create Page")}
                </Button>

                {editId ? (
                  <Button variant="outline" onClick={clearEdit}>
                    Cancel Edit
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => {
                    // quick reset
                    setSelectedProduct("");
                    setSelectedLocation("");
                    setTitle("");
                    setSeoTitle("");
                    setSeoDesc("");
                    setCanonical("");
                    setSchemaText("{}");
                  }}>
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded overflow-hidden bg-gray-100">
                    {previewProduct?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewProduct.image_url} alt={previewProduct.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Preview OG</div>
                    <div className="font-semibold text-lg">
                      {seoTitle || title || "Title will appear here"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 line-clamp-3">
                      {seoDesc || "SEO description will appear here"}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      {canonical || (previewProduct && previewLocation ? buildCanonical(previewProduct.product_type, previewProduct.slug, previewLocation.slug) : "Canonical will appear here")}
                    </div>
                    <div className="mt-2">
                      {previewLocation && (
                        <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                          {previewLocation.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded space-y-2">
                <div className="text-sm font-medium">JSON-LD Preview</div>
                <pre className="text-xs max-h-56 overflow-auto p-2 bg-gray-50 rounded">
                  {(() => {
                    try {
                      const s = JSON.parse(schemaText || "{}");
                      return JSON.stringify(s, null, 2);
                    } catch (e) {
                      return `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
                    }
                  })()}
                </pre>
              </div>

              <div className="p-3 border rounded">
                <div className="text-sm font-medium mb-2">SEO Snippets</div>
                <div className="mb-2">
                  <div className="text-xs text-gray-500">Meta Title</div>
                  <div className="text-sm">{seoTitle || title}</div>
                </div>
                <div className="mb-2">
                  <div className="text-xs text-gray-500">Meta Description</div>
                  <div className="text-sm">{seoDesc || "—"}</div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search + List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Location Pages</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input placeholder="Search title / product / location" value={query} onChange={(e) => { setQuery(e.target.value); setPageIdx(1); }} />
            <div className="ml-auto text-sm text-gray-500">Showing {filtered.length || 0} results</div>
          </div>

          <div className="space-y-3">
            {visiblePages.length === 0 && (
              <div className="text-sm text-gray-500 p-4">No pages found.</div>
            )}

            {visiblePages.map((p) => {
              const prod = products.find((x) => x.id === p.product_id);
              const loc = locations.find((x) => x.id === p.location_id);
              const url = (prod && loc) ? `/${prod.product_type === "event" ? "events" : "services"}/${prod.slug}/${loc.slug}` : "#";

              return (
                <div key={p.id} className="flex items-center gap-3 p-3 border rounded">
                  {/* product image */}
                  <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {prod?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prod.image_url} alt={prod.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">
                          {prod?.title} • {loc?.name} • {p.product_type}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a href={url} className="text-sm text-blue-600 underline" target="_blank" rel="noreferrer">Preview</a>
                        <Button size="sm" onClick={() => enterEdit(p)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDuplicate(p)}>Duplicate</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Created: {formatDate(p.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between mt-6">
            <div>
              <Button size="sm" onClick={() => setPageIdx((s) => Math.max(1, s - 1))} disabled={pageIdx === 1}>Prev</Button>
              <Button size="sm" className="ml-2" onClick={() => setPageIdx((s) => Math.min(totalPages, s + 1))} disabled={pageIdx === totalPages}>Next</Button>
            </div>

            <div className="text-sm text-gray-600">
              Page {pageIdx} of {totalPages}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
