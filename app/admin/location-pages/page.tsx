"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash, Edit, Copy, Plus, ExternalLink } from "lucide-react";

/* -------------------------
   Types
   ------------------------- */
type Location = {
  id: string;
  name?: string | null;
  city?: string | null;
  slug?: string | null;
  created_at?: string | null;
};

type Product = {
  id: string;
  title?: string | null;
  slug?: string | null;
  product_type?: "event" | "service";
  description?: string | null;
};

type LocationPage = {
  id: string;
  product_id: string;
  product_type: "event" | "service" | string;
  location_id: string;

  title: string;
  slug?: string | null;

  seo_title?: string | null;
  seo_description?: string | null;

  canonical_url?: string | null;
  schema_json?: any | null;

  is_active?: boolean;
  created_at?: string | null;

  product?: Product | null;
  location?: Location | null;
};

/* -------------------------
   Component
   ------------------------- */
export default function AdminLocationPages() {
  const router = useRouter();

  // data
  const [pages, setPages] = useState<LocationPage[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // search / pagination
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const PAGE_SIZE = 12;

  // modal / form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<LocationPage | null>(null);

  const [formState, setFormState] = useState({
    id: "",
    product_id: "",
    product_type: "service",
    location_id: "",
    title: "",
    slug: "",
    seo_title: "",
    seo_description: "",
    is_active: true,
  });

  // Load everything
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pagesRes, locRes, prodRes] = await Promise.all([
        fetch("/api/admin/location-pages").then((r) => r.json()),
        fetch("/api/admin/locations").then((r) => r.json()),
        fetch("/api/admin/products-for-locations").then((r) => r.json()),
      ]);

      setPages(pagesRes?.data || []);
      setLocations(locRes?.data || []);
      setProducts(prodRes?.data || []);
    } catch (err) {
      console.error("loadAll error", err);
      toast.error("Failed to load admin data — check console");
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  function resetForm() {
    setFormState({
      id: "",
      product_id: "",
      product_type: "service",
      location_id: "",
      title: "",
      slug: "",
      seo_title: "",
      seo_description: "",
      is_active: true,
    });
    setEditing(null);
  }

  function openCreateModal(product?: Product, location?: Location) {
    resetForm();
    if (product) {
      setFormState((s) => ({ ...s, product_id: product.id, product_type: (product.product_type as any) || "service" }));
    }
    if (location) {
      setFormState((s) => ({ ...s, location_id: location.id }));
    }
    setIsModalOpen(true);
  }

  function openEditModal(p: LocationPage) {
    setEditing(p);
    setFormState({
      id: p.id,
      product_id: p.product_id,
      product_type: p.product_type || "service",
      location_id: p.location_id,
      title: p.title || "",
      slug: p.slug || "",
      seo_title: p.seo_title || "",
      seo_description: p.seo_description || "",
      is_active: p.is_active ?? true,
    });
    setIsModalOpen(true);
  }

  // Auto-generate title/slug/seo when selects change in modal
  useEffect(() => {
    if (!formState.product_id || !formState.location_id) return;

    const prod = products.find((p) => p.id === formState.product_id);
    const loc = locations.find((l) => l.id === formState.location_id);
    if (!prod || !loc) return;

    const cleanTitle = `${prod.title} in ${loc.name || loc.city || ""}`.trim();
    const cleanSlug = `${(prod.title || "").toLowerCase().replace(/\s+/g, "-")}-${loc.slug || ""}`.replace(
      /[^a-z0-9-]/g,
      ""
    );

    setFormState((s) => ({
      ...s,
      title: s.title || cleanTitle,
      slug: s.slug || cleanSlug,
      seo_title: s.seo_title || `Best ${prod.title} in ${loc.name || loc.city} – Book Now`,
      seo_description:
        s.seo_description ||
        `Hire ${prod.title} in ${loc.name || loc.city}. Professional service for weddings, corporates & events.`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.product_id, formState.location_id]);

  // Save (create or update)
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!formState.title || !formState.product_id || !formState.location_id) {
      toast.error("Title, Product and Location are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formState };
      const method = formState.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/location-pages", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        console.error("save error", json);
        toast.error(json?.error || "Save failed");
        return;
      }

      toast.success(formState.id ? "Updated" : "Created");
      await loadAll();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error("handleSave", err);
      toast.error("Save failed — check console");
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm("Delete this location-specific page?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        console.error("delete error", json);
        toast.error(json?.error || "Delete failed");
        return;
      }
      toast.success("Deleted");
      setPages((s) => s.filter((p) => p.id !== id));
    } catch (err) {
      console.error("handleDelete", err);
      toast.error("Delete failed — check console");
    } finally {
      setDeletingId(null);
    }
  }

  // Duplicate
  async function handleDuplicate(p: LocationPage) {
    if (!confirm("Duplicate this page (quick copy)?")) return;
    try {
      const body = {
        product_id: p.product_id,
        location_id: p.location_id,
        title: `${p.title} (Copy)`,
        seo_title: p.seo_title,
        seo_description: p.seo_description,
      };
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Duplicate failed");
        return;
      }
      toast.success("Duplicated");
      await loadAll();
    } catch (err) {
      console.error("duplicate", err);
      toast.error("Duplicate failed");
    }
  }

  // Build preview/open URL — prefer canonical_url if present
 function buildProductUrl(lp: LocationPage) {
  // If canonical_url exists and is valid, ALWAYS use it
  if (lp?.canonical_url && lp.canonical_url.startsWith("http")) {
    return lp.canonical_url;
  }

  // Fallback manual build
  const productSlug = lp.product?.slug || lp.slug || "";
  const locSlug = lp.location?.slug || "";
  if (!productSlug || !locSlug) return "#";

  const base =
    lp.product_type === "event"
      ? "https://www.retreatarcade.in/events"
      : "https://www.retreatarcade.in/services";

  return `${base}/${productSlug}/${locSlug}`;
}


  // Filtering + pagination
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const prod = (p.product?.title || "").toLowerCase();
      const loc = (p.location?.name || p.location?.city || p.location?.slug || "").toLowerCase();
      return title.includes(q) || prod.includes(q) || loc.includes(q);
    });
  }, [pages, query]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = filtered.slice((pageIndex - 1) * PAGE_SIZE, pageIndex * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Location Pages</h1>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search title / product / location..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPageIndex(1);
              }}
              className="w-72"
            />
            <Button onClick={() => openCreateModal()} variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" /> New Page
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pages list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pages ({total})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginated.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 bg-white rounded shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600">
                              {p.product?.title ? p.product.title.substring(0, 2).toUpperCase() : "PR"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{p.title}</p>
                                {p.location?.name && (
                                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                    {p.location?.name}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">
                                  {p.product?.title || p.product_id}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{p.seo_description || ""}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={buildProductUrl(p)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>

                            <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicate(p)}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {paginated.length === 0 && <p className="text-sm text-gray-500">No pages found.</p>}
                    </div>

                    {/* pagination */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {(pageIndex - 1) * PAGE_SIZE + 1} -{" "}
                        {Math.min(pageIndex * PAGE_SIZE, total)} of {total}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                          disabled={pageIndex === 1}
                        >
                          Prev
                        </Button>
                        <div className="text-sm">
                          Page {pageIndex} / {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                          disabled={pageIndex === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Create from Product/Location + quick actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Create from Product / Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Pick Product</Label>
                  <select
                    className="mt-2 w-full border px-3 py-2 rounded"
                    value={formState.product_id}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        product_id: e.target.value,
                        product_type:
                          (products.find((x) => x.id === e.target.value)?.product_type as any) || "service",
                      }))
                    }
                  >
                    <option value="">— Select Product —</option>
                    {products.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.title} ({pr.product_type})
                      </option>
                    ))}
                  </select>

                  <Label>Pick Location</Label>
                  <select
                    className="mt-2 w-full border px-3 py-2 rounded"
                    value={formState.location_id}
                    onChange={(e) => setFormState((s) => ({ ...s, location_id: e.target.value }))}
                  >
                    <option value="">— Select Location —</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name || loc.city || loc.slug}
                      </option>
                    ))}
                  </select>

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!formState.product_id || !formState.location_id) {
                        toast.error("Select product and location first");
                        return;
                      }
                      const prod = products.find((p) => p.id === formState.product_id);
                      const loc = locations.find((l) => l.id === formState.location_id);
                      setFormState((s) => ({
                        ...s,
                        title: `${prod?.title || "Product"} in ${loc?.name || loc?.city || ""}`,
                        seo_title: `${prod?.title} in ${loc?.name || loc?.city || ""} – Book Now`,
                        seo_description: `${prod?.title} available in ${loc?.name || loc?.city || ""}. Affordable, professional service.`,
                      }));
                      setIsModalOpen(true);
                    }}
                  >
                    Create Page From Selection
                  </Button>

                  <hr />

                  <div className="text-xs text-gray-500">
                    Tip: use the product & location selectors above to quickly create a location-specific page.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => {
                    loadAll();
                    toast.success("Reloaded");
                  }}
                  size="sm"
                >
                  Reload
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  size="sm"
                >
                  Blank Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center py-10 px-4 bg-black/50">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editing ? "Edit Location Page" : "Create Location Page"}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <form onSubmit={(e) => handleSave(e)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Product</Label>
                    <select
                      className="mt-2 w-full border px-3 py-2 rounded"
                      value={formState.product_id}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          product_id: e.target.value,
                          product_type:
                            (products.find((x) => x.id === e.target.value)?.product_type as any) || "service",
                        }))
                      }
                      required
                    >
                      <option value="">— Select Product —</option>
                      {products.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.title} ({pr.product_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Location</Label>
                    <select
                      className="mt-2 w-full border px-3 py-2 rounded"
                      value={formState.location_id}
                      onChange={(e) => setFormState((s) => ({ ...s, location_id: e.target.value }))}
                      required
                    >
                      <option value="">— Select Location —</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name || loc.city || loc.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={formState.title}
                    onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))}
                    placeholder="AI Photobooth Rental in Hyderabad"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formState.slug}
                      onChange={(e) => setFormState((s) => ({ ...s, slug: e.target.value }))}
                      placeholder="ai-photobooth-rental-hyderabad"
                    />
                  </div>

                  <div>
                    <Label>SEO Title</Label>
                    <Input
                      value={formState.seo_title}
                      onChange={(e) => setFormState((s) => ({ ...s, seo_title: e.target.value }))}
                      placeholder="Best AI Photobooth Rental in Hyderabad – Book Now"
                    />
                  </div>
                </div>

                <div>
                  <Label>SEO Description</Label>
                  <Textarea
                    value={formState.seo_description}
                    onChange={(e) => setFormState((s) => ({ ...s, seo_description: e.target.value }))}
                    rows={4}
                    placeholder="Affordable AI photobooth rental in Hyderabad — weddings, corporate, parties."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editing ? "Update Page" : "Create Page"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
