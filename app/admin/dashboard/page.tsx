'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Image, MessageSquare, Users, Settings, LogOut, Plus } from 'lucide-react';
import { getSession, signOut } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    events: 0,
    services: 0,
    blogPosts: 0,
    inquiries: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, [router]);

  async function checkAuth() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
    } else {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    const [eventsData, servicesData, blogData, inquiriesData] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      events: eventsData.count || 0,
      services: servicesData.count || 0,
      blogPosts: blogData.count || 0,
      inquiries: inquiriesData.count || 0,
    });
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/admin');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Events', value: stats.events.toString(), icon: Calendar, color: 'text-blue-600' },
    { label: 'Services', value: stats.services.toString(), icon: FileText, color: 'text-green-600' },
    { label: 'Blog Posts', value: stats.blogPosts.toString(), icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Inquiries', value: stats.inquiries.toString(), icon: Users, color: 'text-orange-600' },
  ];

  const quickActions = [
    { label: 'New Event', href: '/admin/events/new', icon: Calendar },
    { label: 'New Service', href: '/admin/services/new', icon: FileText },
    { label: 'New Blog Post', href: '/admin/blog/new', icon: MessageSquare },
    { label: 'Media Library', href: '/admin/media', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="outline"
                        className="w-full h-24 flex flex-col items-center justify-center space-y-2"
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm">{action.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/events">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Events
                  </Button>
                </Link>
                <Link href="/admin/services">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Services
                  </Button>
                </Link>
                <Link href="/admin/blog">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Manage Blog
                  </Button>
                </Link>
                <Link href="/admin/inquiries">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Inquiries
                  </Button>
                </Link>
                <Link href="/admin/homepage">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Homepage
                  </Button>
                </Link>
                <Link href="/admin/about">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    About Page
                  </Button>
                </Link>
                <Link href="/admin/media">
                  <Button variant="outline" className="w-full justify-start">
                    <Image className="h-4 w-4 mr-2" />
                    Media Library
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Site Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">New inquiry from Priya Sharma</p>
                  <p className="text-sm text-gray-600">Wedding planning request</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="font-medium">Event published: Tech Conference 2025</p>
                  <p className="text-sm text-gray-600">Corporate event added</p>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New blog post published</p>
                  <p className="text-sm text-gray-600">10 Essential Wedding Tips</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
