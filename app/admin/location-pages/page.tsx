// app/admin/location-pages/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

type PageItem = {
  id: string;
  product_type: string;
  slug: string;
  location_slug: string;
  title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
};

export default function AdminLocationPages() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [productType, setProductType] = useState('events');
  const [slug, setSlug] = useState('');
  const [locationSlug, setLocationSlug] = useState('');
  const [title, setTitle] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPages();
    fetchLocations();
  }, []);

  async function fetchPages() {
    try {
      const res = await fetch('/api/admin/location-pages');
      const json = await res.json();
      setPages(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pages');
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch('/api/admin/locations');
      const json = await res.json();
      setLocations(json.data || []);
      if (json.data?.[0]) setLocationSlug(json.data[0].slug);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !locationSlug || !title) {
      toast.error('Please fill slug, location and title');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/location-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: productType,
          slug,
          location_slug: locationSlug,
          title,
          meta_title: metaTitle,
          meta_description: metaDescription,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success('Location page created');
      setSlug('');
      setTitle('');
      setMetaTitle('');
      setMetaDescription('');
      fetchPages();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location page?')) return;
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success('Deleted');
      setPages((p) => p.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Delete failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Location Specific Page</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Product Type</Label>
                  <select className="w-full rounded border p-2" value={productType} onChange={(e) => setProductType(e.target.value)}>
                    <option value="events">Event</option>
                    <option value="services">Service</option>
                  </select>
                </div>
                <div>
                  <Label>Slug (product slug)</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ai-photobooth-rental" />
                </div>
                <div>
                  <Label>Location</Label>
                  <select className="w-full rounded border p-2" value={locationSlug} onChange={(e) => setLocationSlug(e.target.value)}>
                    {locations.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Title (H1)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Best AI Photobooth Rental in Hyderabad – Affordable Prices" />
              </div>

              <div>
                <Label>Meta Title (optional)</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              </div>

              <div>
                <Label>Meta Description (optional)</Label>
                <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
              </div>

              <div>
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Location Page'}</Button>
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
              {pages.length === 0 && <p className="text-sm text-gray-500">No pages yet.</p>}
              {pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.product_type} / {p.slug} / {p.location_slug}</p>
                  </div>
                  <div>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
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
