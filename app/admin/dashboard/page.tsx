'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, FileText, MessageSquare, Users, Settings, LogOut,
  MapPin, Map, Star, Image as ImageIcon, Plus, ArrowRight,
  ExternalLink, Eye, TrendingUp,
} from 'lucide-react';
import { getSession, signOut } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    events: 0,
    services: 0,
    blogPosts: 0,
    enquiries: 0,
    totalViews: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, [router]);

  async function checkAuth() {
    const { session } = await getSession();
    if (!session) router.push('/admin');
    else setIsLoading(false);
  }

  async function fetchStats() {
    // ✅ FIX: was querying 'inquiries' (no such table, no such page existed).
    // Now correctly queries 'contact_enquiries' — the real, working table.
    const [eventsData, servicesData, blogData, enquiriesData, viewsData] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('contact_enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('view_count'),
    ]);

    const totalViews = (viewsData.data || []).reduce((sum, e: any) => sum + (e.view_count || 0), 0);

    setStats({
      events: eventsData.count || 0,
      services: servicesData.count || 0,
      blogPosts: blogData.count || 0,
      enquiries: enquiriesData.count || 0,
      totalViews,
    });
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/admin');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Products', value: stats.events, icon: Calendar, accent: 'blue' },
    { label: 'Services', value: stats.services, icon: FileText, accent: 'green' },
    { label: 'Blog Posts', value: stats.blogPosts, icon: MessageSquare, accent: 'purple' },
    // ✅ FIX: now correctly points to /admin/enquiries (not /admin/inquiries which didn't exist)
    { label: 'New Enquiries', value: stats.enquiries, icon: Users, accent: 'orange', href: '/admin/enquiries' },
    { label: 'Total Views', value: stats.totalViews, icon: TrendingUp, accent: 'pink' },
  ];

  const accentMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    pink:   { bg: 'bg-pink-50',   text: 'text-pink-600' },
  };

  const quickActions = [
    { label: 'New Product', href: '/admin/events/new', icon: Calendar, accent: 'blue' },
    { label: 'New Service', href: '/admin/services/new', icon: FileText, accent: 'green' },
    { label: 'New Blog Post', href: '/admin/blog/new', icon: MessageSquare, accent: 'purple' },
    { label: 'Media Library', href: '/admin/media', icon: ImageIcon, accent: 'pink' },
  ];

  const managementGroups = [
    {
      title: 'Content',
      items: [
        { label: 'Manage Products', desc: `${stats.events} products`, href: '/admin/events', icon: Calendar },
        { label: 'Manage Services', desc: `${stats.services} services`, href: '/admin/services', icon: FileText },
        { label: 'Manage Blog', desc: `${stats.blogPosts} posts`, href: '/admin/blog', icon: MessageSquare },
        { label: 'Testimonials', desc: 'Client reviews', href: '/admin/testimonials', icon: Star },
      ],
    },
    {
      title: 'Leads & Pages',
      items: [
        { label: 'Enquiries', desc: `${stats.enquiries} received`, href: '/admin/enquiries', icon: Users, highlight: stats.enquiries > 0 },
        { label: 'Homepage', desc: 'Hero & sections', href: '/admin/homepage', icon: FileText },
        { label: 'About Page', desc: 'Company story', href: '/admin/about', icon: FileText },
        { label: 'Location Pages', desc: 'City landing pages', href: '/admin/location-pages', icon: Map },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Manage Locations', desc: 'Service areas', href: '/admin/locations', icon: MapPin },
        { label: 'Media Library', desc: 'Uploaded images', href: '/admin/media', icon: ImageIcon },
        { label: 'Site Settings', desc: 'Global config', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 text-sm">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/" target="_blank">
                <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                  <ExternalLink className="h-3.5 w-3.5" /> View Site
                </button>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with Retreat Arcade.</p>
        </div>

        {/* ── Stats — 5 cards, enquiries clickable + highlighted if new ──── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            const colors = accentMap[stat.accent];
            const CardInner = (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  {stat.href && stat.value > 0 && (
                    <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
            return stat.href ? (
              <Link key={stat.label} href={stat.href}>{CardInner}</Link>
            ) : (
              <div key={stat.label}>{CardInner}</div>
            );
          })}
        </div>

        {/* ── Quick Actions — full width row of 4 ──────────────────────── */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colors = accentMap[action.accent];
              return (
                <Link key={action.label} href={action.href}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center gap-3 text-center group">
                    <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{action.label}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 -mt-2">
                      <Plus className="h-3 w-3" /> Create
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Management — grouped into 3 clean columns ────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Management</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {managementGroups.map((group) => (
              <div key={group.title} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item: any) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.label} href={item.href}>
                        <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition group ${item.highlight ? 'bg-orange-50' : ''}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition">
                              <Icon className="h-4 w-4 text-gray-500 group-hover:text-orange-600 transition" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                              <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
