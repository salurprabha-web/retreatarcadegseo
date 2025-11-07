'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name: string | null;
  category: string | null;
  featured_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    checkAuthAndFetchPosts();
  }, [router]);

  async function checkAuthAndFetchPosts() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      toast.error('Failed to load blog posts');
    } else {
      setBlogPosts(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete blog post');
    } else {
      toast.success('Blog post deleted successfully');
      setBlogPosts(blogPosts.filter((post) => post.id !== id));
    }
  }

  async function togglePublish(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('blog_posts')
      .update({ published: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update blog post');
    } else {
      toast.success(`Blog post ${!currentStatus ? 'published' : 'unpublished'}`);
      checkAuthAndFetchPosts();
    }
  }

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
              <span className="text-gray-600">Blog Management</span>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Blog Posts</h2>
            <p className="text-gray-600 mt-1">Manage your blog content</p>
          </div>
          <Link href="/admin/blog/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {blogPosts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blog Posts</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first blog post</p>
              <Link href="/admin/blog/new">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Create Blog Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {post.title}
                        </h3>
                        <Badge variant={post.published ? 'default' : 'secondary'}>
                          {post.published ? 'Published' : 'Draft'}
                        </Badge>
                        {post.category && (
                          <Badge variant="outline" className="bg-orange-50">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {post.author_name && (
                          <span>By {post.author_name}</span>
                        )}
                        <span>
                          {format(new Date(post.created_at), 'MMM dd, yyyy')}
                        </span>
                        <span>/{post.slug}</span>
                      </div>
                    </div>
                    {post.featured_image_url && (
                      <div className="ml-6 flex-shrink-0">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-32 h-24 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Link href={`/admin/blog/${post.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(post.id, post.published)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {post.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
