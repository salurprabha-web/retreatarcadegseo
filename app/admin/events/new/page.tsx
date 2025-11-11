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

  useEffect(() => {
    checkAuthAndLoadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function checkAuthAndLoadEvent() {
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

  const buildSchemaJson = (ev: any) => {
    const domain = 'https://www.retreatarcade.in';
    const url = ev.canonical_url || `${domain}/events/${ev.slug}`;

    const eventSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: ev.title,
      description: ev.summary || ev.description || '',
      startDate: ev.start_date || undefined,
      endDate: ev.end_date || undefined,
      location: ev.location
        ? {
            '@type': 'Place',
            name: ev.location,
          }
        : undefined,
      image: ev.image_url ? [ev.image_url] : undefined,
      url,
      offers: ev.price
        ? {
            '@type': 'Offer',
            price: String(ev.price),
            priceCurrency: 'INR',
            url,
          }
        : undefined,
    };

    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: ev.title,
      description: ev.summary || ev.description || '',
      image: ev.image_url ? [ev.image_url] : undefined,
      offers: ev.price
        ? {
            '@type': 'Offer',
            price: String(ev.price),
            priceCurrency: 'INR',
            url,
            availability: 'https://schema.org/InStock',
          }
        : undefined,
    };

    return [eventSchema, productSchema];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string) || '';
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const imageUrl = (formData.get('image_url') as string) || null;
    const galleryImagesText = (formData.get('gallery_images') as string) || '';

    const galleryImages = galleryImagesText
      ? galleryImagesText
          .split('\n')
          .map((url) => url.trim())
          .filter((url) => url.length > 0)
      : [];

    const highlightsText = (formData.get('highlights') as string) || '';
    const highlights = highlightsText
      ? highlightsText
          .split('\n')
          .map((h) => h.trim())
          .filter((h) => h.length > 0)
      : [];

    const priceRaw = (formData.get('price') as string) || '';
    const price = priceRaw ? parseFloat(priceRaw) : null;

    const eventData: any = {
      title,
      slug,
      summary: (formData.get('summary') as string) || '',
      description: (formData.get('description') as string) || '',
      category: (formData.get('category') as string) || 'General',
      price: price,
      start_date: (formData.get('date') as string) || null,
      end_date: (formData.get('end_date') as string) || null,
      location: (formData.get('location') as string) || null,
      max_participants:
        parseInt((formData.get('max_participants') as string) || '') || null,
      image_url: imageUrl || null,
      gallery_images: galleryImages,
      highlights,
      is_featured: formData.get('is_featured') === 'on',
      updated_at: new Date().toISOString(),
      // SEO fields:
      meta_title: (formData.get('meta_title') as string) || null,
      meta_description: (formData.get('meta_description') as string) || null,
      meta_keywords: (formData.get('meta_keywords') as string)
        ? (formData.get('meta_keywords') as string)
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : [],
      canonical_url: (formData.get('canonical_url') as string) || null,
    };

    // Build schema_json (array)
    try {
      eventData.schema_json = buildSchemaJson({ ...event, ...eventData });
    } catch (err) {
      console.warn('schema build failed', err);
      eventData.schema_json = {};
    }

    const { error } = await supabase.from('events').update(eventData).eq('id', eventId);

    if (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Event updated successfully!');
    router.push('/admin/events');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Edit Event</span>
            </div>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" name="title" required placeholder="Enter event title" defaultValue={event.title} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" name="category" required placeholder="e.g., Wedding, Corporate, Cultural" defaultValue={event.category || 'General'} />
                <p className="text-sm text-gray-500">Event category for filtering</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input id="price" name="price" required placeholder="e.g., 18000" defaultValue={event.price ?? ''} />
                <p className="text-sm text-gray-500">price for rental (INR)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">Featured Image URL *</Label>
                <Input id="image_url" name="image_url" type="url" required placeholder="Cloudinary or Google Drive image link" defaultValue={event.image_url || ''} />
                <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900">Google Drive Instructions:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Open your image in Google Drive</li>
                    <li>Click Share and change to Anyone with the link</li>
                    <li>Copy the link (example: drive.google.com/file/d/FILE_ID/view)</li>
                    <li>Paste the link here - it will be auto-converted</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery_images">Gallery Images URLs</Label>
                <Textarea id="gallery_images" name="gallery_images" rows={5} defaultValue={event.gallery_images ? event.gallery_images.join('\n') : ''} />
                <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900">Tips:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>One URL per line</li>
                    <li>Make sure Google Drive images are shared publicly</li>
                    <li>Cloudinary URLs work directly</li>
                    <li>Test your links in a browser first</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date *</Label>
                  <Input id="date" name="date" type="date" required defaultValue={formatDate(event.start_date)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" name="end_date" type="date" defaultValue={formatDate(event.end_date)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" required placeholder="City, State" defaultValue={event.location} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Maximum Participants</Label>
                <Input id="max_participants" name="max_participants" type="number" placeholder="e.g., 500" defaultValue={event.max_participants || ''} />
                <p className="text-sm text-gray-500">Leave empty if unlimited</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea id="summary" name="summary" required rows={3} defaultValue={event.summary} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description (HTML accepted) *</Label>
                <Textarea id="description" name="description" required rows={8} defaultValue={event.description} />
                <p className="text-sm text-gray-500">You can paste HTML here. It will be rendered on the public event page.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlights">Event Highlights</Label>
                <Textarea id="highlights" name="highlights" rows={5} defaultValue={event.highlights ? event.highlights.join('\n') : ''} />
                <p className="text-sm text-gray-500">Enter one highlight per line</p>
              </div>

              {/* SEO inputs */}
              <div className="pt-4 border-t space-y-2">
                <h3 className="text-lg font-semibold">SEO & Social</h3>
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input id="meta_title" name="meta_title" defaultValue={event.meta_title || ''} />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea id="meta_description" name="meta_description" rows={3} defaultValue={event.meta_description || ''} />
                </div>
                <div>
                  <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
                  <Input id="meta_keywords" name="meta_keywords" defaultValue={event.meta_keywords ? event.meta_keywords.join(', ') : ''} />
                </div>
                <div>
                  <Label htmlFor="canonical_url">Canonical URL (optional)</Label>
                  <Input id="canonical_url" name="canonical_url" defaultValue={event.canonical_url || ''} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="is_featured" name="is_featured" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" defaultChecked={event.is_featured} />
                <Label htmlFor="is_featured" className="font-normal cursor-pointer">Feature this event on homepage</Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/admin/events">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
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
