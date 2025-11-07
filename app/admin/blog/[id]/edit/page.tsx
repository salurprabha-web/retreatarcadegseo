'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string | null;
  category: string | null;
  featured_image_url: string | null;
  content_images: any[] | null;
  reading_time: string | null;
  tags: string[] | null;
  status: string;
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    checkAuthAndLoadPost();
  }, [params.id]);

  async function checkAuthAndLoadPost() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      toast.error('Blog post not found');
      router.push('/admin/blog');
      return;
    }

    setBlogPost(data);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
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

    const { error } = await supabase
      .from('blog_posts')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
      setIsSubmitting(false);
      return;
    }

    toast.success('Blog post updated successfully!');
    router.push('/admin/blog');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!blogPost) {
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
              <span className="text-gray-600">Edit Blog Post</span>
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
                  defaultValue={blogPost.title}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  defaultValue={blogPost.slug}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  required
                  rows={3}
                  defaultValue={blogPost.excerpt}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  rows={12}
                  defaultValue={blogPost.content}
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
                  defaultValue={blogPost.author_name || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={blogPost.category || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image_url">Featured Image URL</Label>
                <Input
                  id="featured_image_url"
                  name="featured_image_url"
                  type="url"
                  defaultValue={blogPost.featured_image_url || ''}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading_time">Reading Time</Label>
                <Input
                  id="reading_time"
                  name="reading_time"
                  defaultValue={blogPost.reading_time || '5 min read'}
                  placeholder="5 min read"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={blogPost.tags ? blogPost.tags.join(', ') : ''}
                  placeholder="event planning, weddings, tips"
                />
                <p className="text-sm text-gray-500">Separate tags with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={blogPost.status || 'draft'}
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
                  defaultValue={blogPost.content_images ? JSON.stringify(blogPost.content_images, null, 2) : ''}
                  placeholder='{\n  "url": "https://example.com/image.jpg",\n  "caption": "Image caption",\n  "alt": "Alt text"\n}'
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
