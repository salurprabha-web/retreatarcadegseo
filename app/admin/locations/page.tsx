// app/admin/locations/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Location = {
  id: string;
  city: string;
  slug: string;
  state?: string | null;
  is_active: boolean;
  created_at?: string;
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [city, setCity] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const res = await fetch('/api/admin/locations', { cache: 'no-store' });
      const json = await res.json();

      console.log("Fetched locations:", json);

      if (!res.ok) {
        toast.error(json.error || "Failed to load locations");
        return;
      }

      setLocations(Array.isArray(json.locations) ? json.locations : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load locations');
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !slug) {
      toast.error('City and slug required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, slug }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to add location");

      toast.success('Location added');
      setCity('');
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
    if (!confirm('Delete this location?')) return;

    try {
      const res = await fetch(`/api/admin/locations?id=${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Delete failed");

      toast.success('Deleted');
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Delete failed');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* ADD LOCATION */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Hyderabad" />
              </div>

              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hyderabad" />
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Location'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* LIST LOCATIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Locations</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3">

              {locations.length === 0 && (
                <p className="text-sm text-gray-500">No locations yet.</p>
              )}

              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
                  <div>
                    <p className="font-medium">{loc.city}</p>
                    <p className="text-xs text-gray-500">{loc.slug}</p>
                  </div>

                  <Button variant="destructive" size="sm" onClick={() => handleDelete(loc.id)}>
                    Delete
                  </Button>
                </div>
              ))}

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
