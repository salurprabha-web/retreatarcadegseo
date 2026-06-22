'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { ArrowLeft, Cpu } from 'lucide-react';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function EditServicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

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

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setService((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDescriptionChange = (value: string) => {
    setService((prev: any) => ({ ...prev, description: value }));
  };

  const handleSchemaChange = (value: string) => {
    setService((prev: any) => ({ ...prev, schema_json: value }));
  };

  const toggleEvent = (eventId: string) => {
    setService((prev: any) => {
      const current = prev.related_event_ids || [];
      return current.includes(eventId)
        ? { ...prev, related_event_ids: current.filter((id: string) => id !== eventId) }
        : { ...prev, related_event_ids: [...current, eventId] };
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    const highlights = Array.isArray(service.highlights)
      ? service.highlights
      : typeof service.highlights === 'string'
      ? service.highlights.split('\n').filter(Boolean)
      : [];

    // ✅ Parse meta_keywords from comma-separated string to array
    const meta_keywords = typeof service.meta_keywords === 'string'
      ? service.meta_keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : Array.isArray(service.meta_keywords) ? service.meta_keywords : [];

    // ✅ Parse schema_json safely — invalid JSON shouldn't crash the save
    let schema_json = null;
    if (service.schema_json) {
      if (typeof service.schema_json === 'string') {
        try {
          schema_json = JSON.parse(service.schema_json);
        } catch {
          toast.error('Schema JSON is invalid — saved without it.');
        }
      } else {
        schema_json = service.schema_json;
      }
    }

    // ✅ Tech services don't carry related_event_ids — clear it on save so
    // stale product links never linger if the flag was toggled on later.
    const isTech = service.is_tech_service || false;

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
        is_tech_service: isTech,
        meta_title: service.meta_title,
        meta_description: service.meta_description,
        meta_keywords,
        schema_json,
        related_event_ids: isTech ? [] : (service.related_event_ids || []),
        is_featured: service.is_featured || false,
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

  const isTechService = service.is_tech_service === true;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Service</h1>
        <Link href="/admin/services">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Services</Button>
        </Link>
      </div>

      {isTechService && (
        <div className="flex items-center gap-2 mb-6 text-sm font-semibold bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-200">
          <Cpu className="h-4 w-4" /> Technology Service — pricing, locations and product linking are hidden below
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info — always shown ──────────────────────────────────── */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={service.title || ''} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" value={service.slug || ''} onChange={handleChange} required />
          <p className="text-xs text-gray-400 mt-1">
            Canonical URL will be: https://www.retreatarcade.in/services/{service.slug || '...'}
          </p>
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" value={service.summary || ''} onChange={handleChange} rows={3} />
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
            rows={5}
            placeholder={'e.g.\nCustom branded registration forms\nQR code check-in\nLive attendee dashboard'}
            value={Array.isArray(service.highlights) ? service.highlights.join('\n') : service.highlights || ''}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-400 mt-1">
            One highlight per line. These appear as bullet points or feature cards depending on the template.
          </p>
        </div>

        <div>
          <Label htmlFor="image_url">Featured Image URL</Label>
          <Input id="image_url" name="image_url" value={service.image_url || ''} onChange={handleChange} placeholder="https://res.cloudinary.com/..." />
          {service.image_url && (
            <img src={service.image_url} alt="Preview" className="mt-2 h-24 object-contain rounded border" />
          )}
        </div>

        {/* ── Featured toggle — always relevant ───────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <input
            type="checkbox" id="is_featured" name="is_featured"
            checked={service.is_featured || false} onChange={handleChange}
            className="mt-0.5 h-4 w-4 accent-orange-500 cursor-pointer"
          />
          <div>
            <Label htmlFor="is_featured" className="text-sm font-semibold text-orange-800 cursor-pointer">
              Show on Homepage
            </Label>
            <p className="text-xs text-orange-600 mt-0.5">
              When checked, this service appears in the featured services section on the homepage.
            </p>
          </div>
        </div>

        {/* ── Tech service flag — controls everything below ───────────────── */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <input
            type="checkbox" id="is_tech_service"
            checked={service.is_tech_service || false}
            onChange={(e) => setService((prev: any) => ({ ...prev, is_tech_service: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer"
          />
          <div>
            <Label htmlFor="is_tech_service" className="text-sm font-semibold text-blue-900 cursor-pointer">
              This is a Technology Service (no fixed price)
            </Label>
            <p className="text-xs text-blue-700 mt-0.5">
              Check this for software, website, app, or custom-build services. Shows "Get a Custom Quote" instead of pricing, uses the dedicated tech-service template, and hides Starting Price and Related Events below.
            </p>
          </div>
        </div>

        {/* ── Starting Price — ✅ HIDDEN for tech services ─────────────────── */}
        {!isTechService && (
          <div>
            <Label htmlFor="price_from">Starting Price (₹)</Label>
            <Input
              id="price_from" name="price_from" type="number"
              value={service.price_from || ''} onChange={handleChange}
              placeholder="e.g., 3500"
            />
          </div>
        )}

        {/* ── Related Events — ✅ HIDDEN for tech services ─────────────────── */}
        {!isTechService && (
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
                    type="checkbox" className="mr-2"
                    checked={service.related_event_ids?.includes(ev.id) || false}
                    onChange={() => toggleEvent(ev.id)}
                  />
                  <span className="text-sm font-medium">{ev.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── For tech services: explain what replaces Related Events ─────── */}
        {isTechService && (
          <div className="border-t border-gray-300 pt-6 mt-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-600">
                <strong>No manual product linking needed.</strong> This service automatically cross-links to other Technology Services and to a curated set of complementary event products (Social Wall, Quiz Buzzer, Digital Spin Wheel) on the live page — no setup required here.
              </p>
            </div>
          </div>
        )}

        {/* ── SEO Section — always shown ──────────────────────────────────── */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" value={service.meta_title || ''} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" value={service.meta_description || ''} onChange={handleChange} rows={3} />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
              <Input
                id="meta_keywords" name="meta_keywords"
                value={Array.isArray(service.meta_keywords) ? service.meta_keywords.join(', ') : service.meta_keywords || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url" name="canonical_url"
                value={service.canonical_url || ''} onChange={handleChange}
                placeholder={`https://www.retreatarcade.in/services/${service.slug || ''}`}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to default to the standard URL shown above.</p>
            </div>

            <div>
              <Label htmlFor="schema_json">Schema JSON (Advanced)</Label>
              <Textarea
                id="schema_json" name="schema_json" rows={8} className="font-mono text-xs"
                value={typeof service.schema_json === 'string'
                  ? service.schema_json
                  : JSON.stringify(service.schema_json || {}, null, 2)}
                onChange={(e) => handleSchemaChange(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                {isTechService
                  ? 'For tech services: use SoftwareApplication + BreadcrumbList. FAQ schema is generated automatically — do not duplicate it here.'
                  : 'Leave blank to auto-generate Service schema from the fields above.'}
              </p>
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
