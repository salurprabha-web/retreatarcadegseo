'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, Pencil, Trash2, Search,
  ArrowUpDown, ArrowUp, ArrowDown, X, Eye, TrendingUp, FileText, CheckCircle2,
} from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string | null;
  category: string | null;
  featured_image_url: string | null;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
};

type SortKey = 'created_at' | 'view_count' | 'title';
type SortDir = 'asc' | 'desc';

export default function AdminBlogPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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
      setBlogPosts((prev) => prev.filter((post) => post.id !== id));
    }
  }

  // ✅ FIX: this previously updated a `published` boolean field that
  // doesn't match the actual schema — lib/blog.ts confirms the real
  // field is `status: 'published' | 'draft'`. The old toggle was
  // silently writing to a field the public-facing fetch never reads,
  // meaning it likely did nothing visible on the live site.
  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update blog post');
    } else {
      toast.success(`Blog post ${newStatus === 'published' ? 'published' : 'unpublished'}`);
      setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    }
  }

  const stats = useMemo(() => {
    const totalViews = blogPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const published = blogPosts.filter((p) => p.status === 'published').length;
    return { total: blogPosts.length, totalViews, published };
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    let result = [...blogPosts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'view_count') cmp = (a.view_count || 0) - (b.view_count || 0);
      else cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [blogPosts, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) return <ArrowUpDown className="h-3 w-3 text-gray-300" />;
    return dir === 'asc' ? <ArrowUp className="h-3 w-3 text-orange-600" /> : <ArrowDown className="h-3 w-3 text-orange-600" />;
  }

  const hasActiveFilters = search.trim() !== '';

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
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
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

        {/* ── Quick stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Posts</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.published}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalViews.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </div>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="text-gray-500">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <p className="text-sm text-gray-500 mb-3">
            Showing {filteredPosts.length} of {blogPosts.length} posts
          </p>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => toggleSort('title')}
                    >
                      <span className="flex items-center gap-1.5">
                        Title <SortIcon active={sortKey === 'title'} dir={sortDir} />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => toggleSort('view_count')}
                    >
                      <span className="flex items-center gap-1.5">
                        Views <SortIcon active={sortKey === 'view_count'} dir={sortDir} />
                      </span>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => toggleSort('created_at')}
                    >
                      <span className="flex items-center gap-1.5">
                        Created <SortIcon active={sortKey === 'created_at'} dir={sortDir} />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {hasActiveFilters ? 'No posts match your search.' : 'No blog posts found. Create your first post!'}
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-xs text-gray-400">{post.slug}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {post.category ? (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(post.id, post.status)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                              post.status === 'published'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </button>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-gray-400" />
                            {post.view_count || 0}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(post.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/blog/${post.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
