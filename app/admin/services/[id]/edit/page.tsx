'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// ✅ Rich text editor
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function EditServicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  // ✅ Fetch service + all events
  useEffect(() => {
    async function fetchData() {
      const [serviceRes, eventsRes] = await Promise.all([
        supabase.from('services').select('*').eq('id', params.id).single(),
        supabase.from('events').select('id, title, slug, status').eq('status', 'published').order('title'),
      ]);

      if (serviceRes.error) {
        toast.error('Failed to fetch service details');
        console.error(serviceRes.error);
      } else {
        setService(serviceRes.data);
      }

      if (eventsRes.error) {
        console.error('Error loading events:', eventsRes.error);
      } else {
        setEvents(eventsRes.data || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [params.id]);

  // ✅ Change handlers
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setService((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setService((prev: any) => ({ ...prev, description: value }));
  };

  const handleSchemaChange = (value: string) => {
    setService((prev: any) => ({ ...prev, schema_json: value }));
  };

  // ✅ Toggle event selection
  const toggleEvent = (eventId: string) => {
    setService((prev: any) => {
      const current = prev.related_event_ids || [];
      return current.includes(eventId)
        ? { ...prev, related_event_ids: current.filter((id: string) => id !== eventId) }
        : { ...prev, related_event_ids: [...current, eventId] };
    });
  };

  // ✅ Save updates
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    const highlights = Array.isArray(service.highlights)
      ? service.highlights
      : typeof service.highlights === 'string'
      ? service.highlights.split('\n').filter(Boolean)
      : [];

    const { error } = await supabase
      .from('services')
      .update({
        title: service.title,
        slug: service.slug,
        summary: service.summary,
        description: service.description,
        highlights,
        image_url: service.image_url,
        price_from: service.price_from ? parseFloat(service.price_from) : null,
        meta_title: service.meta_title,
        meta_description: service.meta_description,
        meta_keywords: service.meta_keywords,
        schema_json: service.schema_json,
        related_event_ids: service.related_event_ids || [],
        updated_at: new Date(),
      })
      .eq('id', params.id);

    if (error) {
      console.error(error);
      toast.error('Failed to update service');
    } else {
      toast.success('Service updated successfully!');
      router.push('/admin/services');
    }

    setSaving(false);
  };

  if (loading) return <p className="text-center py-10">Loading service...</p>;

  if (!service) return <p className="text-center py-10 text-red-500">Service not found.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Service</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={service.title || ''} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" value={service.slug || ''} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" value={service.summary || ''} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="description">Description (HTML)</Label>
          <ReactQuill theme="snow" value={service.description || ''} onChange={handleDescriptionChange} />
        </div>

        <div>
          <Label htmlFor="highlights">Highlights (one per line)</Label>
          <Textarea
            id="highlights"
            name="highlights"
            value={Array.isArray(service.highlights) ? service.highlights.join('\n') : service.highlights || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input id="image_url" name="image_url" value={service.image_url || ''} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="price_from">Starting Price (₹)</Label>
          <Input
            id="price_from"
            name="price_from"
            type="number"
            value={service.price_from || ''}
            onChange={handleChange}
          />
        </div>

        {/* ✅ Related Events Manager */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Related Events</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select the events that belong under this service pillar page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {events.map((ev) => (
              <label
                key={ev.id}
                className={`border rounded-lg p-3 cursor-pointer hover:bg-orange-50 ${
                  service.related_event_ids?.includes(ev.id) ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={service.related_event_ids?.includes(ev.id) || false}
                  onChange={() => toggleEvent(ev.id)}
                />
                <span className="text-sm font-medium">{ev.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ✅ SEO Section */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" value={service.meta_title || ''} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" value={service.meta_description || ''} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input id="meta_keywords" name="meta_keywords" value={service.meta_keywords || ''} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="schema_json">Schema JSON</Label>
              <Textarea
                id="schema_json"
                name="schema_json"
                rows={6}
                value={typeof service.schema_json === 'string'
                  ? service.schema_json
                  : JSON.stringify(service.schema_json || {}, null, 2)
                }
                onChange={(e) => handleSchemaChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-6 w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
