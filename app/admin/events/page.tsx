'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Plus, Pencil, Trash2, Search, ArrowUpDown,
  ArrowUp, ArrowDown, X, Eye, TrendingUp, FileText, CheckCircle2,
} from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Event = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  status: string;
  view_count: number;
  price: number | null;
  is_featured: boolean;
  created_at: string;
};

type SortKey = 'created_at' | 'view_count' | 'title' | 'price';
type SortDir = 'asc' | 'desc';

export default function AdminEventsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    checkAuthAndFetchEvents();
  }, [router]);

  async function checkAuthAndFetchEvents() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, category, status, view_count, price, is_featured, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } else {
      setEvents(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted successfully');
      setEvents(events.filter((e) => e.id !== id));
    }
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from('events')
      .update({ is_featured: !current })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      setEvents(events.map((e) => (e.id === id ? { ...e, is_featured: !current } : e)));
      toast.success(!current ? 'Marked as featured' : 'Removed from featured');
    }
  }

  // ── Derived: unique categories for filter dropdown ────────────────────────
  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [events]);

  // ── Derived: quick stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalViews = events.reduce((sum, e) => sum + (e.view_count || 0), 0);
    const published = events.filter((e) => e.status === 'published').length;
    const draft = events.filter((e) => e.status === 'draft').length;
    return { total: events.length, totalViews, published, draft };
  }, [events]);

  // ── Filtering + sorting pipeline ─────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || e.slug?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'view_count') cmp = (a.view_count || 0) - (b.view_count || 0);
      else if (sortKey === 'price') cmp = (a.price || 0) - (b.price || 0);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [events, search, statusFilter, categoryFilter, sortKey, sortDir]);

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

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
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
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Events Management</span>
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
            <h2 className="text-3xl font-bold text-gray-900">Events</h2>
            <p className="text-gray-600 mt-1">Manage your events and celebrations</p>
          </div>
          <Link href="/admin/events/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Event
            </Button>
          </Link>
        </div>

        {/* ── Quick stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Products</p>
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
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.draft}</p>
              <p className="text-xs text-gray-500">Drafts</p>
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

        {/* ── Search + filters bar ──────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 sm:w-52"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* ── Results count ─────────────────────────────────────────────────── */}
        {hasActiveFilters && (
          <p className="text-sm text-gray-500 mb-3">
            Showing {filteredEvents.length} of {events.length} products
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
                      onClick={() => toggleSort('price')}
                    >
                      <span className="flex items-center gap-1.5">
                        Price <SortIcon active={sortKey === 'price'} dir={sortDir} />
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
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={() => toggleSort('view_count')}
                    >
                      <span className="flex items-center gap-1.5">
                        Views <SortIcon active={sortKey === 'view_count'} dir={sortDir} />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        {hasActiveFilters
                          ? 'No products match your filters.'
                          : 'No events found. Create your first event!'}
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-xs text-gray-400">{event.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.category ? (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {event.category}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              event.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {event.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {event.price ? `₹${event.price.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(event.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-gray-400" />
                            {event.view_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleFeatured(event.id, event.is_featured)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                              event.is_featured
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {event.is_featured ? '★ Featured' : '☆ Feature'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/events/${event.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(event.id)}
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
