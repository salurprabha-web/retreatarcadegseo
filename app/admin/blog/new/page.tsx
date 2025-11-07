'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = (formData.get('slug') as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const authorName = formData.get('author_name') as string;
    const category = formData.get('category') as string;
    const featuredImageUrl = formData.get('featured_image_url') as string;
    const readingTime = formData.get('reading_time') as string;
    const tagsInput = formData.get('tags') as string;
    const contentImagesInput = formData.get('content_images') as string;
    const status = formData.get('status') as string;

    let tags: string[] = [];
    if (tagsInput) {
      tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    let contentImages: any[] = [];
    if (contentImagesInput) {
      try {
        contentImages = JSON.parse(contentImagesInput);
      } catch (e) {
        toast.error('Invalid JSON format for content images');
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('blog_posts').insert([{
      title,
      slug,
      excerpt,
      content,
      author_name: authorName || null,
      category: category || null,
      featured_image_url: featuredImageUrl || null,
      content_images: contentImages,
      reading_time: readingTime || '5 min read',
      tags: tags,
      status: status || 'draft',
      published_at: status === 'published' ? new Date().toISOString() : null,
    }]);

    if (error) {
      console.error('Error creating blog post:', error);
      toast.error('Failed to create blog post');
      setIsSubmitting(false);
      return;
    }

    toast.success('Blog post created successfully!');
    router.push('/admin/blog');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">New Blog Post</span>
            </div>
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="10 Essential Tips for Planning Your Dream Wedding"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-sm text-gray-500">
                  Optional: Customize the URL. Auto-generated if left empty.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  rows={3}
                  placeholder="A brief summary of the blog post..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  rows={12}
                  placeholder="Write your blog post content here..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  name="author_name"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="Wedding Tips, Event Planning, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image_url">Featured Image URL</Label>
                <Input
                  id="featured_image_url"
                  name="featured_image_url"
                  type="url"
                  placeholder="https://images.pexels.com/..."
                />
                <p className="text-sm text-gray-500">
                  Use a Cloudinary, Google Drive, or Pexels image URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading_time">Reading Time</Label>
                <Input
                  id="reading_time"
                  name="reading_time"
                  defaultValue="5 min read"
                  placeholder="5 min read"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="event planning, weddings, tips"
                />
                <p className="text-sm text-gray-500">Separate tags with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content_images">Content Images (JSON Format)</Label>
                <Textarea
                  id="content_images"
                  name="content_images"
                  rows={6}
                  placeholder='[{"url": "https://example.com/image1.jpg", "caption": "Beautiful setup", "alt": "Event decoration"}]'
                />
                <p className="text-sm text-gray-500">
                  Add images that will appear within the blog content. Format: Array of objects with url, caption, and alt fields.
                  <br />
                  Example: [{'{'}"url": "...", "caption": "...", "alt": "..."{'}'}]
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Link href="/admin/blog">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Blog Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
