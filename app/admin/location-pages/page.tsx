// app/admin/location-pages/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

type Loc = { id: string; city: string; slug: string; };
type Product = { id: string; title: string; slug: string; };

export default function AdminLocationPages() {
  const [locationPages, setLocationPages] = useState<any[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [events, setEvents] = useState<Product[]>([]);
  const [productType, setProductType] = useState<'service'|'event'>('service');
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [productType]);

  async function fetchAll() {
    try {
      const [lp, locs, svcs, evts] = await Promise.all([
        fetch('/api/admin/location-pages').then(r => r.json()),
        fetch('/api/admin/locations').then(r => r.json()),
        fetch('/api/admin/services').then(r => r.json()).catch(()=>({data:[] })),
        fetch('/api/admin/events').then(r => r.json()).catch(()=>({data:[] })),
      ]);
      setLocationPages(lp?.data || []);
      setLocations(locs?.data || []);
      setServices(svcs?.data || []);
      setEvents(evts?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin data');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !locationId || !title || !slug) return toast.error('fill required fields');
    setLoading(true);
    try {
      const body = { product_type: productType, product_id: productId, location_id: locationId, title, slug, seo_title: seoTitle, seo_description: seoDesc };
      const res = await fetch('/api/admin/location-pages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Create failed');
      toast.success('Location page created');
      setTitle(''); setSlug(''); setSeoTitle(''); setSeoDesc('');
      fetchAll();
    } catch (err:any) {
      console.error(err);
      toast.error(err.message || 'Create failed');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this location page?')) return;
    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      toast.success('Deleted');
      setLocationPages((s) => s.filter(p => p.id !== id));
    } catch (err:any) {
      console.error(err);
      toast.error(err.message || 'Delete failed');
    }
  }

  const productOptions = productType === 'service' ? services : events;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle>Create Location Page</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Product Type</Label>
                <div className="flex gap-3 mt-2">
                  <Button variant={productType==='service' ? 'default' : 'outline'} onClick={()=>{ setProductType('service'); setProductId(''); }}>Service</Button>
                  <Button variant={productType==='event' ? 'default' : 'outline'} onClick={()=>{ setProductType('event'); setProductId(''); }}>Event</Button>
                </div>
              </div>

              <div>
                <Label>Select Product</Label>
                <select value={productId} onChange={(e)=>setProductId(e.target.value)} className="w-full border px-3 py-2 rounded">
                  <option value="">-- choose --</option>
                  {productOptions.map(p => <option key={p.id} value={p.id}>{p.title || p.slug}</option>)}
                </select>
              </div>

              <div>
                <Label>Location</Label>
                <select value={locationId} onChange={(e)=>setLocationId(e.target.value)} className="w-full border px-3 py-2 rounded">
                  <option value="">-- choose location --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.city}</option>)}
                </select>
              </div>

              <div>
                <Label>Location Page Title</Label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="AI Photobooth Rental in Hyderabad" />
              </div>

              <div>
                <Label>Slug (last part)</Label>
                <Input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="ai-photobooth-rental" />
                <p className="text-xs text-gray-500 mt-1">Final URL: /services/{slug}/[location] (automatically merged). Provide slug without slashes.</p>
              </div>

              <div>
                <Label>SEO Title (optional)</Label>
                <Input value={seoTitle} onChange={(e)=>setSeoTitle(e.target.value)} placeholder="AI Photobooth Rental in Hyderabad - Rent Now" />
              </div>

              <div>
                <Label>SEO Description (optional)</Label>
                <Input value={seoDesc} onChange={(e)=>setSeoDesc(e.target.value)} placeholder="Short SEO friendly description" />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" className="mt-3" disabled={loading}>{loading ? 'Creating...' : 'Create Location Page'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Existing Location Pages</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {locationPages.length === 0 && <p className="text-sm text-gray-500">No location pages yet.</p>}
              {locationPages.map((lp: any) => (
                <div key={lp.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div>
                    <p className="font-medium">{lp.title}</p>
                    <p className="text-xs text-gray-500">{lp.product_type} • {lp.locations?.city || ''} • {lp.slug}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a href={lp.product_type === 'service' ? `/services/${lp.slug}/${lp.locations?.slug}` : `/events/${lp.slug}/${lp.locations?.slug}`} target="_blank" rel="noreferrer">
                      <Button size="sm">View</Button>
                    </a>
                    <Button variant="destructive" size="sm" onClick={()=>handleDelete(lp.id)}>Delete</Button>
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
