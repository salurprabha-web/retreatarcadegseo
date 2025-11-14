// app/admin/location-pages/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Admin Location Pages UI
 *
 * - List existing location pages
 * - Create new
 * - Edit existing
 * - Delete
 *
 * NOTE: This client component expects your server API at:
 *   GET  /api/admin/location-pages         => list
 *   POST /api/admin/location-pages         => create  (body JSON)
 *   PUT  /api/admin/location-pages?id=...  => update  (body JSON)
 *   DELETE /api/admin/location-pages?id=.. => delete
 *
 * Body shape for create/update:
 * {
 *   product_type: 'service' | 'event',
 *   product_id: 'uuid',
 *   location_id: 'uuid',
 *   title: 'string',
 *   slug?: 'string',
 *   seo_title?: 'string',
 *   seo_description?: 'string',
 *   canonical_url?: 'https://...'
 * }
 */

type Location = { id: string; name: string; slug: string };
type Product = { id: string; title: string; slug: string; product_type?: 'service' | 'event' };
type LocationPage = {
  id: string;
  product_type: 'service' | 'event';
  product_id: string;
  location_id: string;
  title: string;
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  created_at?: string;
};

export default function AdminLocationPages() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [events, setEvents] = useState<Product[]>([]);
  const [pages, setPages] = useState<LocationPage[]>([]);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productType, setProductType] = useState<'service' | 'event'>('service');
  const [productId, setProductId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [canonicalUrl, setCanonicalUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  async function fetchLists() {
    try {
      const [locRes, pagesRes, svcRes, evtRes] = await Promise.all([
        fetch('/api/admin/locations').then(r => r.json()),
        fetch('/api/admin/location-pages').then(r => r.json()),
        fetch('/api/admin/services').then(r => r.json()).catch(()=>({data:[] })),
        fetch('/api/admin/events').then(r => r.json()).catch(()=>({data:[]})),
      ]);

      setLocations(locRes.data || []);
      setPages(pagesRes.data || []);
      // services and events expected to return { data: [...] }
      setServices(svcRes.data?.map((s:any)=>({ id: s.id, title: s.title, slug: s.slug })) || []);
      setEvents(evtRes.data?.map((e:any)=>({ id: e.id, title: e.title, slug: e.slug })) || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lists');
    }
  }

  // When product or location changes we auto-fill canonical + auto slug (if empty)
  useEffect(() => {
    buildAutoFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, locationId, productType]);

  function slugify(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function buildAutoFields() {
    if (!productId || !locationId) {
      setCanonicalUrl('');
      return;
    }

    const product = (productType === 'service' ? services : events).find(p => p.id === productId);
    const loc = locations.find(l => l.id === locationId);
    if (!product || !loc) return;

    // canonical: prefer canonical path pattern (product slug + location slug)
    const canonical = productType === 'service'
      ? `https://www.retreatarcade.in/services/${product.slug}/${loc.slug}`
      : `https://www.retreatarcade.in/events/${product.slug}/${loc.slug}`;

    setCanonicalUrl(canonical);

    // if slug field empty, auto-set
    if (!slug) {
      setSlug(slugify(`${product.title} ${loc.name}`));
    }

    // if seo title empty, auto-suggest
    if (!seoTitle) {
      setSeoTitle(`Best ${product.title} in ${loc.name} – Book Now`);
    }

    if (!seoDescription) {
      setSeoDescription(`${product.title} in ${loc.name}. High-quality, affordable, and professional service for events.`);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!productId || !locationId || !title) {
      toast.error('Please choose product, location and enter title');
      return;
    }

    setLoading(true);

    const payload = {
      product_type: productType,
      product_id: productId,
      location_id: locationId,
      title,
      slug: slug || undefined,
      seo_title: seoTitle || undefined,
      seo_description: seoDescription || undefined,
      canonical_url: canonicalUrl || undefined,
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/admin/location-pages?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/location-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Server error');
      }

      toast.success(editingId ? 'Updated' : 'Created');
      // reset form
      resetForm();
      // refresh lists
      await fetchLists();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSeoTitle('');
    setSeoDescription('');
    setProductId('');
    setProductType('service');
    setLocationId('');
    setCanonicalUrl('');
  }

  function handleEdit(page: LocationPage) {
    setEditingId(page.id);
    setProductType(page.product_type);
    setProductId(page.product_id);
    setLocationId(page.location_id);
    setTitle(page.title);
    setSlug(page.slug || '');
    setSeoTitle(page.seo_title || '');
    setSeoDescription(page.seo_description || '');
    setCanonicalUrl(page.canonical_url || '');
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location page?')) return;
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      toast.success('Deleted');
      setPages((p) => p.filter(pg => pg.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Delete failed');
    }
  }

  // Build preview URL for a location page (canonical if present else product+location)
  function buildPreviewUrl(p: LocationPage) {
    const loc = locations.find(l => l.id === p.location_id);
    const productList = p.product_type === 'service' ? services : events;
    const pr = productList.find(x => x.id === p.product_id);
    if (!loc || !pr) return '#';
    // preferred canonical if stored
    if (p.canonical_url) return p.canonical_url;
    // fallback canonical route
    return p.product_type === 'service'
      ? `https://www.retreatarcade.in/services/${pr.slug}/${loc.slug}`
      : `https://www.retreatarcade.in/events/${pr.slug}/${loc.slug}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Pages — Create / Edit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Product Type</Label>
                <select className="w-full p-2 border rounded" value={productType} onChange={(e)=>setProductType(e.target.value as any)}>
                  <option value="service">Service</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <Label>Product</Label>
                <select className="w-full p-2 border rounded" value={productId} onChange={(e)=>setProductId(e.target.value)}>
                  <option value="">-- Select product --</option>
                  {(productType === 'service' ? services : events).map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Location</Label>
                <select className="w-full p-2 border rounded" value={locationId} onChange={(e)=>setLocationId(e.target.value)}>
                  <option value="">-- Select location --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Title (Location specific)</Label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="AI Photobooth Rental in Hyderabad" />
              </div>

              <div>
                <Label>Slug (optional)</Label>
                <Input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="ai-photobooth-rental-hyderabad" />
              </div>

              <div>
                <Label>Canonical URL (auto)</Label>
                <Input value={canonicalUrl} onChange={(e)=>setCanonicalUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="md:col-span-3">
                <Label>SEO Title</Label>
                <Input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} placeholder="Best AI Photobooth in Hyderabad – Book Now" />
              </div>

              <div className="md:col-span-3">
                <Label>SEO Description</Label>
                <Input value={seoDescription} onChange={(e)=>setSeoDescription(e.target.value)} placeholder="Short SEO description" />
              </div>

              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" className="bg-amber-500" disabled={loading}>
                  {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Page' : 'Create Page')}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Reset</Button>
                {editingId && <Button type="button" variant="destructive" onClick={() => { if (confirm('Cancel edit?')) resetForm(); }}>Cancel Edit</Button>}
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
              {pages.length === 0 && <p className="text-sm text-gray-500">No location pages yet.</p>}
              {pages.map(pg => (
                <div key={pg.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
                  <div>
                    <div className="font-medium">{pg.title}</div>
                    <div className="text-xs text-gray-500">
                      {pg.product_type} · {pg.slug || '(auto slug)'} · {pg.created_at ? new Date(pg.created_at).toLocaleString() : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={buildPreviewUrl(pg)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Preview</a>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pg)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(pg.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
