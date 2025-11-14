// app/admin/location-pages/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Loc = { id: string; city: string; slug?: string };
type Product = { id: string; title: string; slug?: string };
type PageItem = any;

export default function AdminLocationPages() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [events, setEvents] = useState<Product[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [productId, setProductId] = useState("");
  const [productType, setProductType] = useState<"service" | "event">("service");
  const [locationId, setLocationId] = useState("");
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  // edit
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [locRes, svcRes, evRes, pagesRes] = await Promise.all([
        fetch("/api/admin/locations").then((r) => r.json()),
        fetch("/api/admin/services?all=true").then((r) => r.json()).catch(()=>({data:[] })),
        fetch("/api/admin/events?all=true").then((r) => r.json()).catch(()=>({data:[] })),
        fetch("/api/admin/location-pages").then((r) => r.json()),
      ]);

      setLocations(locRes.data || []);
      setServices(svcRes.data || []);
      setEvents(evRes.data || []);
      setPages(pagesRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  function genTitle(productName: string, locName: string) {
    return `${productName} in ${locName}`;
  }

  function genSeoTitle(t: string) {
    return `Best ${t} – Affordable Prices`;
  }
  function genSeoDesc(productName: string, locName: string) {
    return `Hire ${productName} in ${locName}. High-quality, affordable, and professional service for events.`;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !locationId) {
      return toast.error("Pick product and location");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          title: title || (productType === "service" ? services.find(s=>s.id===productId)?.title : events.find(e=>e.id===productId)?.title) + " in " + (locations.find(l=>l.id===locationId)?.city || ""),
          seo_title: seoTitle || genSeoTitle(title || ""),
          seo_description: seoDesc || genSeoDesc(title || "", locations.find(l=>l.id===locationId)?.city || ""),
        }),
      });
      const json = await res.json();
      if (res.status >= 400) throw new Error(json?.error || "Create failed");
      toast.success("Location page created");
      setTitle(""); setSeoTitle(""); setSeoDesc(""); setProductId(""); setLocationId("");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function openEdit(item: any) {
    setEditing(item);
    setTitle(item.title);
    setSeoTitle(item.seo_title || "");
    setSeoDesc(item.seo_description || "");
  }

  async function saveEdit() {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title,
          seo_title: seoTitle,
          seo_description: seoDesc,
        }),
      });
      const json = await res.json();
      if (res.status >= 400) throw new Error(json?.error || "Update failed");
      toast.success("Updated");
      setEditing(null);
      fetchData();
    } catch (err:any) {
      console.error(err);
      toast.error(err.message||"Update failed");
    } finally { setLoading(false); }
  }

  async function removePage(id: string) {
    if (!confirm("Delete this location page?")) return;
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.status >= 400) throw new Error(json?.error || "Delete failed");
      toast.success("Deleted");
      setPages((p)=>p.filter((x:any)=>x.id!==id));
    } catch (err:any) {
      console.error(err);
      toast.error(err.message||"Delete failed");
    }
  }

  // bulk generator: generate for all services / events × selected locations
  async function handleBulkGenerate(which: "service"|"event") {
    const selectedLocations = locations.map(l=>l.id); // You can implement UI to pick subset; for now generate for all.
    const products = (which === "service" ? services : events).map(p=>p.id);
    if (!selectedLocations.length || !products.length) return toast.error("No locations or products");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, product_type: which, locations: selectedLocations, products }),
      });
      const json = await res.json();
      if (res.status >= 400) throw new Error(json?.error || "Bulk failed");
      toast.success("Bulk generation complete");
      fetchData();
    } catch (err:any) {
      console.error(err);
      toast.error(err.message||"Bulk failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Pages — Manage</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Product Type</Label>
                <select className="w-full" value={productType} onChange={(e)=>setProductType(e.target.value as any)}>
                  <option value="service">Service</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <Label>Product</Label>
                <select className="w-full" value={productId} onChange={(e)=>setProductId(e.target.value)}>
                  <option value="">Pick product</option>
                  {(productType==="service"?services:events).map((p)=>(
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Location</Label>
                <select className="w-full" value={locationId} onChange={(e)=> {
                  setLocationId(e.target.value);
                  const loc = locations.find(l=>l.id===e.target.value);
                  const prod = (productType==="service"?services:events).find(pr=>pr.id===productId);
                  if (prod && loc) {
                    const generated = genTitle(prod.title, loc.city);
                    setTitle(generated);
                    setSeoTitle(genSeoTitle(generated));
                    setSeoDesc(genSeoDesc(prod.title, loc.city));
                  }
                }}>
                  <option value="">Pick location</option>
                  {locations.map((l)=> <option key={l.id} value={l.id}>{l.city}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Title (editable)</Label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="AI Photobooth Rental in Hyderabad" />
                <div className="flex gap-2 mt-2">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Page"}</Button>
                  <Button type="button" variant="ghost" onClick={()=>handleBulkGenerate(productType)}>Generate All {productType === "service" ? "Services" : "Events"} × Locations</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Location Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pages.length===0 && <p className="text-sm text-gray-500">No pages yet.</p>}
              {pages.map((p:any)=> {
                const locName = p.locations?.city || p.location_id;
                const productTitle = (p.product_type === "event" ? p.events?.title : p.services?.title) || p.product_id;
                const url = `https://www.retreatarcade.in/${p.product_type === 'event' ? 'events' : 'services'}/${p.slug}/${p.locations?.slug ?? (p.locations?.city?.toLowerCase().replace(/\s+/g,'-'))}`;
                return (
                  <div key={p.id} className="p-3 bg-white rounded shadow-sm flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-600">{p.product_type.toUpperCase()}</div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500">{productTitle} · {locName}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Preview</a>
                        <button onClick={()=>openEdit(p)} className="text-sm text-gray-600">Edit</button>
                        <button onClick={()=>removePage(p.id)} className="text-sm text-red-600">Delete</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit modal (simple inline area) */}
        {editing && (
          <Card>
            <CardHeader>
              <CardTitle>Edit: {editing.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="ghost" onClick={()=>setEditing(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
