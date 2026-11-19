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
import { adminApi } from '@/components/admin/admin-api';

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
  const [site, setSite] = useState<any>(null);

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
    //
    // ✅ FIX: "Total Views" previously summed ONLY events.view_count,
    // silently ignoring services and blog_posts views entirely — even
    // though those tables now have their own view_count tracking too.
    // Now fetches all three and sums them together for a genuine
    // sitewide total.
    adminApi('/api/admin/site-stats').then(setSite).catch(() => {});
    const [eventsData, servicesData, blogData, enquiriesData, eventsViews, servicesViews, blogViews] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('contact_enquiries').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('view_count'),
      supabase.from('services').select('view_count'),
      supabase.from('blog_posts').select('view_count'),
    ]);

    const sumViews = (rows: any[] | null) =>
      (rows || []).reduce((sum, r: any) => sum + (r.view_count || 0), 0);

    const totalViews =
      sumViews(eventsViews.data) + sumViews(servicesViews.data) + sumViews(blogViews.data);

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
    { label: 'Page views (whole site)', value: site && site.views_total != null ? site.views_total : stats.totalViews, icon: TrendingUp, accent: 'pink' },
    { label: 'Page views today', value: site && site.views_today != null ? site.views_today : '-', icon: Eye, accent: 'blue' },
    { label: 'Unique visitors (all time)', value: site && site.visitors_total != null ? site.visitors_total : '-', icon: Users, accent: 'green' },
    { label: 'Unique visitors today', value: site && site.visitors_today != null ? site.visitors_today : '-', icon: Users, accent: 'purple' },
  ];

  const accentMap: Record<string, { bg: string; text: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    pink:   { bg: 'bg-pink-50',   text: 'text-pink-600' },
  };

  const tasks = [
    { label: 'Check new enquiries', desc: 'See who wants a quote and reply quickly.', href: '/admin/enquiries', icon: Users, accent: 'orange', highlight: stats.enquiries > 0 },
    { label: 'Add a city and create its pages', desc: 'Auto Pages writes a unique page for every service and product. You approve before it goes live.', href: '/admin/auto-pages', icon: Map, accent: 'purple', badge: 'New' },
    { label: 'Add a new product', desc: 'A game, photo booth or VR item you rent out.', href: '/admin/events/new', icon: Calendar, accent: 'blue' },
    { label: 'Add a new service', desc: 'A group of products, like "Photo booth rental".', href: '/admin/services/new', icon: FileText, accent: 'green' },
    { label: 'Write a blog post with AI', desc: 'Pick a keyword, add pictures, approve, and schedule 2 to 3 posts a week.', href: '/admin/blog-ai', icon: MessageSquare, accent: 'pink', badge: 'New' },
    { label: 'Keywords: one owner page each', desc: 'See which phrases you target and which are still free.', href: '/admin/keywords', icon: TrendingUp, accent: 'green', badge: 'New' },
    { label: 'Change homepage text', desc: 'Edit the headline and buttons visitors see first.', href: '/admin/homepage', icon: FileText, accent: 'blue' },
  ];

  const steps = [
    'Add the product (Products > Add New Event).',
    'Open each service it belongs to and tick it under "Related Events".',
    'Go to Auto Pages and click Preview, then Write drafts.',
    'Read the drafts and click Publish.',
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-gray-500 text-sm mt-1">Pick what you want to do. Everything else is in the menu on the left.</p>
        </div>

        {/* ── Stats — 5 cards, enquiries clickable + highlighted if new ──── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            const colors = accentMap[stat.accent];
            const CardInner = (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  {stat.href && Number(stat.value) > 0 && (
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

        <p className="mb-8 text-xs text-gray-400">
          {site && site.ready === false
            ? 'Unique visitors need one setup step: run AUTO_PAGES_STEP9.sql in Supabase. Page views are already whole-site.'
            : site && site.views_since
              ? `Page views count every page opened (one per page per visit). Unique visitors count each browser once a day. Counting started on ${site.views_since}${site.visitors_since ? ` (visitors: ${site.visitors_since})` : ''}. Last 7 days: ${site.views_7d ?? 0} views, ${site.visitors_7d ?? 0} visitors. Today follows India time.`
              : 'Counting starts as soon as people visit.'}
        </p>

        {/* ── What do you want to do? ───────────────────────────────────── */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">What do you want to do?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((t: any) => {
              const Icon = t.icon;
              const colors = accentMap[t.accent];
              return (
                <Link key={t.label} href={t.href}>
                  <div className={`h-full bg-white border rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all flex items-start gap-4 group ${t.highlight ? 'border-orange-300 bg-orange-50/40' : 'border-gray-100'}`}>
                    <div className={`w-11 h-11 shrink-0 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        {t.label}
                        {t.badge && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">{t.badge}</span>}
                        {t.highlight && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">{stats.enquiries} total</span>}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition shrink-0 ml-auto mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── The usual order of work ───────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Adding something new? Follow these steps</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-gray-600">
            {steps.map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-gray-400">New pages stay hidden from visitors and Google until you publish them.</p>
        </div>

      </div>
    </div>
  );
}
