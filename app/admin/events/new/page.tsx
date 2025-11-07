'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getSession, getUser } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [router]);

  async function checkAuth() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
    } else {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { user } = await getUser();

    const imageUrl = formData.get('image_url') as string;
    const galleryImagesText = formData.get('gallery_images') as string;

    const galleryImages = galleryImagesText
      ? galleryImagesText.split('\n').map(url => url.trim()).filter(url => url.length > 0)
      : [];

    const highlightsText = formData.get('highlights') as string;
    const highlights = highlightsText
      ? highlightsText.split('\n').map(h => h.trim()).filter(h => h.length > 0)
      : [];

    const eventData = {
      title,
      slug,
      summary: formData.get('summary') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      start_date: formData.get('date') as string,
      end_date: formData.get('end_date') as string || null,
      location: formData.get('location') as string,
      max_participants: parseInt(formData.get('max_participants') as string) || null,
      image_url: imageUrl || null,
      gallery_images: galleryImages,
      highlights: highlights,
      status: 'published',
      is_featured: formData.get('is_featured') === 'on',
      published_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('events').insert([eventData]);

    if (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Event created successfully!');
    router.push('/admin/events');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">New Event</span>
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
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input id="title" name="title" required placeholder="Enter event title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="Cloudinary or Google Drive image link"
                />
                <p className="text-sm text-gray-500">Paste your Cloudinary or Google Drive image URL</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date *</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" name="end_date" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" name="location" required placeholder="City, State" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Maximum Participants</Label>
                <Input id="max_participants" name="max_participants" type="number" placeholder="e.g., 500" />
                <p className="text-sm text-gray-500">Leave empty if unlimited</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g., Wedding, Cultural, Corporate" defaultValue="General" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  required
                  rows={3}
                  placeholder="Brief description of the event"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={8}
                  placeholder="Detailed event description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlights">Event Highlights</Label>
                <Textarea
                  id="highlights"
                  name="highlights"
                  rows={5}
                  placeholder="Enter one highlight per line, e.g.:\nProfessional event planning\nCustom decoration themes\nProfessional photography\nCatering services available"
                />
                <p className="text-sm text-gray-500">Enter one highlight per line</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery_images">Gallery Images</Label>
                <Textarea
                  id="gallery_images"
                  name="gallery_images"
                  rows={5}
                  placeholder="Enter one image URL per line"
                />
                <p className="text-sm text-gray-500">Paste Cloudinary or Google Drive image URLs, one per line</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <Label htmlFor="is_featured" className="font-normal cursor-pointer">
                  Feature this event on homepage
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/admin/events">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
