'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<any>(null);

  //-----------------------------------------------
  // ✅ Load Event
  //-----------------------------------------------
  useEffect(() => {
    load();
  }, [eventId]);

  async function load() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      toast.error('Event not found');
      router.push('/admin/events');
      return;
    }

    setEvent(data);
    setIsLoading(false);
  }

  //-----------------------------------------------
  // ✅ Submit Form
  //-----------------------------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const title = formData.get('title') as string;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const galleryImagesRaw = formData.get('gallery_images') as string;
    const gallery_images = galleryImagesRaw
      ? galleryImagesRaw.split('\n').map(x => x.trim()).filter(Boolean)
      : [];

    const highlightsRaw = formData.get('highlights') as string;
    const highlights = highlightsRaw
      ? highlightsRaw.split('\n').map(x => x.trim()).filter(Boolean)
      : [];

    const metaKeywordsRaw = formData.get('meta_keywords') as string;
    const meta_keywords = metaKeywordsRaw
      ? metaKeywordsRaw.split(',').map(x => x.trim()).filter(Boolean)
      : [];

    // ✅ Safe JSON parsing
    const schemaJsonRaw = formData.get('schema_json') as string;
    let schema_json = {};
    try {
      schema_json = schemaJsonRaw ? JSON.parse(schemaJsonRaw) : {};
    } catch {
      toast.error('Invalid JSON format in Schema JSON');
      setIsSubmitting(false);
      return;
    }

    //-----------------------------------------------
    // ✅ Build final update object
    //-----------------------------------------------
    const eventData = {
      title,
      slug,
      summary: formData.get('summary'),
      description: formData.get('description'),
      category: formData.get('category'),
      price: formData.get('price'),

      // ✅ FIXED FIELD NAME (start_date, not date)
      start_date: formData.get('start_date') || null,

      // ✅ Fix error: empty string converted to null
      end_date: formData.get('end_date') || null,

      location: formData.get('location'),
      max_participants: formData.get('max_participants')
        ? Number(formData.get('max_participants'))
        : null,

      image_url: formData.get('image_url'),
      gallery_images,
      highlights,
      is_featured: formData.get('is_featured') === 'on',

      // ✅ SEO fields
      meta_title: formData.get('meta_title'),
      meta_description: formData.get('meta_description'),
      meta_keywords,
      canonical_url: formData.get('canonical_url'),
      schema_json,

      updated_at: new Date().toISOString(),
    };

    //-----------------------------------------------
    // ✅ Update Supabase
    //-----------------------------------------------
    const { error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId);

    if (error) {
      console.error(error);
      toast.error('Failed to update event');
      setIsSubmitting(false);
      return;
    }

    toast.success('Event updated successfully!');
    router.push('/admin/events');
  };

  //-----------------------------------------------
  // ✅ Date formatting
  //-----------------------------------------------
  const formatDate = (date: string) =>
    date ? new Date(date).toISOString().split('T')[0] : '';

  //-----------------------------------------------
  // ✅ UI Rendering
  //-----------------------------------------------
  if (isLoading) return <p className="p-10 text-center">Loading...</p>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Edit Event</span>
          </div>

          <Link href="/admin/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ✅ BASIC FIELDS */}
              <InputBlock label="Event Title" name="title" defaultValue={event.title} required />
              <InputBlock label="Category" name="category" defaultValue={event.category} required />
              <InputBlock label="Price" name="price" defaultValue={event.price} required />

              <InputBlock
                label="Featured Image URL"
                name="image_url"
                defaultValue={event.image_url}
                required
              />

              {/* ✅ GALLERY */}
              <TextareaBlock
                label="Gallery Image URLs (one per line)"
                name="gallery_images"
                defaultValue={event.gallery_images?.join('\n') || ''}
                rows={5}
              />

              {/* ✅ DATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputBlock
                  label="Start Date"
                  name="start_date"
                  type="date"
                  defaultValue={formatDate(event.start_date)}
                  required
                />
                <InputBlock
                  label="End Date"
                  name="end_date"
                  type="date"
                  defaultValue={formatDate(event.end_date)}
                />
              </div>

              <InputBlock
                label="Location"
                name="location"
                defaultValue={event.location}
                required
              />

              <InputBlock
                label="Max Participants"
                name="max_participants"
                type="number"
                defaultValue={event.max_participants}
              />

              {/* ✅ SUMMARY & DESCRIPTION */}
              <TextareaBlock
                label="Summary"
                name="summary"
                defaultValue={event.summary}
                required
              />

              <TextareaBlock
                label="Full Description (HTML allowed)"
                name="description"
                defaultValue={event.description}
                rows={10}
                required
              />

              {/* ✅ HIGHLIGHTS */}
              <TextareaBlock
                label="Highlights (one per line)"
                name="highlights"
                defaultValue={event.highlights?.join('\n') || ''}
                rows={6}
              />

              {/* ✅ FEATURED */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  defaultChecked={event.is_featured}
                />
                <Label htmlFor="is_featured">Feature this event</Label>
              </div>

              {/* ✅ SEO SECTION */}
              <h2 className="text-lg font-semibold pt-4">SEO Settings</h2>

              <InputBlock
                label="Meta Title"
                name="meta_title"
                defaultValue={event.meta_title}
              />

              <TextareaBlock
                label="Meta Description"
                name="meta_description"
                defaultValue={event.meta_description}
                rows={4}
              />

              <InputBlock
                label="Meta Keywords (comma separated)"
                name="meta_keywords"
                defaultValue={event.meta_keywords?.join(', ')}
              />

              <InputBlock
                label="Canonical URL"
                name="canonical_url"
                defaultValue={event.canonical_url}
              />

              <TextareaBlock
                label="Schema JSON"
                name="schema_json"
                defaultValue={JSON.stringify(event.schema_json || {}, null, 2)}
                rows={8}
              />

              {/* ✅ BUTTONS */}
              <div className="flex justify-end gap-4">
                <Link href="/admin/events">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" className="bg-orange-600" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ✅ Reusable Blocks
function InputBlock({ label, name, defaultValue, required, type = 'text' }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue || ''} required={required} />
    </div>
  );
}

function TextareaBlock({ label, name, defaultValue, rows = 4, required }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={rows} defaultValue={defaultValue || ''} required={required} />
    </div>
  );
}
