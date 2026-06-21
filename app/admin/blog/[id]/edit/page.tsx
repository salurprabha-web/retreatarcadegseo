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
  // ✅ SEO fields
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  canonical_url: string | null;
  schema_json: any | null;
  og_image_url: string | null;
  noindex: boolean | null;
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

    // ✅ SEO fields
    const metaTitle = formData.get('meta_title') as string;
    const metaDescription = formData.get('meta_description') as string;
    const metaKeywordsInput = formData.get('meta_keywords') as string;
    const canonicalUrl = formData.get('canonical_url') as string;
    const ogImageUrl = formData.get('og_image_url') as string;
    const schemaJsonInput = formData.get('schema_json') as string;
    const noindex = formData.get('noindex') === 'on';

    let tags: string[] = [];
    if (tagsInput) {
      tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // ✅ Parse meta keywords
    let metaKeywords: string[] = [];
    if (metaKeywordsInput) {
      metaKeywords = metaKeywordsInput.split(',').map(k => k.trim()).filter(k => k);
    }

    // ✅ Parse schema JSON safely — falls back to null (auto-generated) if invalid
    let schemaJson: any = null;
    if (schemaJsonInput && schemaJsonInput.trim()) {
      try {
        schemaJson = JSON.parse(schemaJsonInput);
      } catch (e) {
        toast.error('Schema JSON is invalid — saved without it. Auto-generated schema will be used instead.');
      }
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
        // ✅ SEO fields
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        meta_keywords: metaKeywords,
        canonical_url: canonicalUrl || null,
        og_image_url: ogImageUrl || null,
        schema_json: schemaJson,
        noindex: noindex,
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
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
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
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  defaultValue={blogPost.meta_title || ''}
                  placeholder={blogPost.title}
                />
                <p className="text-sm text-gray-500">Shown in Google search results and browser tab. Keep under 60 characters. Leave blank to use the post Title.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  rows={3}
                  defaultValue={blogPost.meta_description || ''}
                  placeholder={blogPost.excerpt}
                />
                <p className="text-sm text-gray-500">Shown under the title in Google search results. Keep under 160 characters. Leave blank to use the Excerpt.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
                <Input
                  id="meta_keywords"
                  name="meta_keywords"
                  defaultValue={blogPost.meta_keywords ? blogPost.meta_keywords.join(', ') : ''}
                  placeholder="wedding photo booth Hyderabad, sangeet entertainment ideas"
                />
                <p className="text-sm text-gray-500">Target search phrases for this post. Separate with commas.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input
                  id="canonical_url"
                  name="canonical_url"
                  type="url"
                  defaultValue={blogPost.canonical_url || ''}
                  placeholder={`https://www.retreatarcade.in/blog/${blogPost.slug}`}
                />
                <p className="text-sm text-gray-500">Leave blank unless this content is duplicated elsewhere — it will default to the standard blog URL.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image_url">Social Share Image URL (OG Image)</Label>
                <Input
                  id="og_image_url"
                  name="og_image_url"
                  type="url"
                  defaultValue={blogPost.og_image_url || ''}
                  placeholder={blogPost.featured_image_url || 'https://example.com/og-image.png'}
                />
                <p className="text-sm text-gray-500">Image shown when this post is shared on WhatsApp, Facebook, LinkedIn etc. Leave blank to use the Featured Image. Recommended size: 1200×630px.</p>
                {(blogPost.og_image_url || blogPost.featured_image_url) && (
                  <img
                    src={blogPost.og_image_url || blogPost.featured_image_url || ''}
                    alt="Current social share image"
                    className="mt-2 h-24 object-contain rounded border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema_json">Custom Schema JSON (Advanced)</Label>
                <Textarea
                  id="schema_json"
                  name="schema_json"
                  rows={6}
                  className="font-mono text-xs"
                  defaultValue={blogPost.schema_json ? JSON.stringify(blogPost.schema_json, null, 2) : ''}
                  placeholder='{"@context":"https://schema.org","@type":"BlogPosting",...}'
                />
                <p className="text-sm text-gray-500">Optional. Must be valid JSON. Leave blank to auto-generate BlogPosting schema from the post content.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="noindex"
                  name="noindex"
                  defaultChecked={blogPost.noindex || false}
                  className="h-4 w-4 accent-orange-500 cursor-pointer"
                />
                <Label htmlFor="noindex" className="cursor-pointer">
                  Hide from Google (noindex)
                </Label>
              </div>
              <p className="text-sm text-gray-500 -mt-2">Use this for posts you want published but not ranked yet — e.g. while still refining content.</p>
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
