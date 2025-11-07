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

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [service, setService] = useState<any>(null);
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [galleryImages, setGalleryImages] = useState<string[]>(['']);

  useEffect(() => {
    checkAuthAndLoadService();
  }, [serviceId]);

  async function checkAuthAndLoadService() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      toast.error('Service not found');
      router.push('/admin/services');
      return;
    }

    setService(data);
    setHighlights(data.highlights && data.highlights.length > 0 ? data.highlights : ['']);
    setGalleryImages(data.gallery_images && data.gallery_images.length > 0 ? data.gallery_images : ['']);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const imageUrl = formData.get('image_url') as string;
    const priceFrom = formData.get('price_from') as string;

    const filteredHighlights = highlights.filter(h => h.trim() !== '');
    const filteredGalleryImages = galleryImages.filter(img => img.trim() !== '');

    const serviceData = {
      title,
      slug,
      summary: formData.get('summary') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      price_from: priceFrom ? parseFloat(priceFrom) : null,
      image_url: imageUrl || null,
      highlights: filteredHighlights,
      gallery_images: filteredGalleryImages,
      is_featured: formData.get('is_featured') === 'on',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', serviceId);

    if (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success('Service updated successfully!');
    router.push('/admin/services');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Edit Service</span>
            </div>
            <Link href="/admin/services">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Service Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Enter service title"
                  defaultValue={service.title}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="Cloudinary or Google Drive image link"
                  defaultValue={service.image_url || ''}
                />
                <p className="text-sm text-gray-500">Paste your Cloudinary or Google Drive image URL</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_from">Starting Price (₹)</Label>
                <Input
                  id="price_from"
                  name="price_from"
                  type="number"
                  placeholder="100000"
                  defaultValue={service.price_from || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  required
                  rows={3}
                  placeholder="Brief description of the service"
                  defaultValue={service.summary}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={8}
                  placeholder="Detailed service description"
                  defaultValue={service.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Detailed Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={10}
                  placeholder="Full detailed content for the service detail page (supports HTML)"
                  defaultValue={service.content || ''}
                />
                <p className="text-sm text-gray-500">This will be displayed on the service detail page</p>
              </div>

              <div className="space-y-2">
                <Label>Key Highlights</Label>
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...highlights];
                        newHighlights[index] = e.target.value;
                        setHighlights(newHighlights);
                      }}
                      placeholder="Enter a key feature or highlight"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (highlights.length > 1) {
                          setHighlights(highlights.filter((_, i) => i !== index));
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHighlights([...highlights, ''])}
                >
                  Add Highlight
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Gallery Images</Label>
                {galleryImages.map((image, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={image}
                      onChange={(e) => {
                        const newImages = [...galleryImages];
                        newImages[index] = e.target.value;
                        setGalleryImages(newImages);
                      }}
                      placeholder="Enter image URL"
                      type="url"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (galleryImages.length > 1) {
                          setGalleryImages(galleryImages.filter((_, i) => i !== index));
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGalleryImages([...galleryImages, ''])}
                >
                  Add Image
                </Button>
                <p className="text-sm text-gray-500">Add multiple images for the gallery section</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  defaultChecked={service.is_featured}
                />
                <Label htmlFor="is_featured" className="font-normal cursor-pointer">
                  Feature this service on homepage
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/admin/services">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={isSubmitting}
                >
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
