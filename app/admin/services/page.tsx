'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Service = {
  id: string;
  title: string;
  status: string;
  is_featured: boolean;
  created_at?: string;
  display_order?: number;
};

export default function AdminServicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    checkAuthAndFetchServices();
  }, [router]);

  async function checkAuthAndFetchServices() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .select('id, title, status, is_featured, created_at, display_order')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } else {
      setServices(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete service');
    } else {
      toast.success('Service deleted successfully');
      setServices((prev) => prev.filter((s) => s.id !== id));
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
      
      {/* TOP NAV */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Services Management</span>
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

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Services</h2>
            <p className="text-gray-600 mt-1">Manage your service offerings</p>
          </div>
          <Link href="/admin/services/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Featured
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No services found. Create your first service!
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              service.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {service.status || 'draft'}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {service.is_featured ? (
                            <Badge className="bg-orange-100 text-orange-800">Featured</Badge>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">

                            {/* NEW: MANAGE BUTTON */}
                            <Link href={`/admin/services/${service.id}`}>
                              <Button variant="default" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                            </Link>

                            {/* Edit */}
                            <Link href={`/admin/services/${service.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(service.id)}
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
