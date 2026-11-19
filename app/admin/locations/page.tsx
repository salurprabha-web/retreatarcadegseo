// app/admin/locations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

async function authed(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  return fetch(url, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` } });
}

type Location = {
  id: string;
  name?: string;
  city?: string;
  slug: string;
  state?: string | null;
  is_active?: boolean;
  created_at?: string;
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const res = await fetch('/api/admin/locations');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || 'Failed to load');
      }
      const json = await res.json();
      setLocations(json.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load locations: ' + (err.message || ''));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) {
      toast.error('Name and slug required');
      return;
    }
    setLoading(true);
    try {
      const res = await authed('/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Add failed');
      toast.success('City added. Next: open Auto Pages to fill its profile and write its pages.');
      setName('');
      setSlug('');
      fetchLocations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Add failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this city? Its pages are removed from the site. This cannot be undone.')) return;
    try {
      const res = await authed(`/api/admin/locations?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      toast.success('Deleted');
      setLocations((s) => s.filter((l) => l.id !== id));
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
            <CardTitle>Manage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyderabad" />
              </div>
              <div className="sm:col-span-1">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hyderabad" />
              </div>
              <div className="sm:col-span-1">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Location'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {locations.length === 0 && <p className="text-sm text-gray-500">No locations yet.</p>}
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div>
                    <p className="font-medium">{loc.name || loc.city || loc.slug}</p>
                    <p className="text-xs text-gray-500">{loc.slug} {loc.state ? `• ${loc.state}` : ''}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(loc.id)}>
                      Delete
                    </Button>
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
