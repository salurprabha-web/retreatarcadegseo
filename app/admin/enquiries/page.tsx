'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  message: string;
  status: string;
  created_at: string;
};

export default function AdminEnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { session } = await getSession();
      if (!session) { router.push('/admin'); return; }

      const { data } = await supabase
        .from('contact_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      setEnquiries(data || []);
      setIsLoading(false);
    }
    init();
  }, [router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Contact Enquiries</span>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Enquiries <span className="text-gray-400 text-xl">({enquiries.length})</span>
        </h2>

        {enquiries.length === 0 ? (
          <p className="text-gray-500">No enquiries yet.</p>
        ) : (
          <div className="space-y-4">
            {enquiries.map((e) => (
              <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{e.name}</p>
                    {e.event_type && <p className="text-xs text-orange-600">{e.event_type}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{e.message}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <a href={`mailto:${e.email}`} className="flex items-center gap-1 hover:text-orange-600"><Mail className="h-3 w-3" />{e.email}</a>
                  {e.phone && <a href={`tel:${e.phone}`} className="flex items-center gap-1 hover:text-orange-600"><Phone className="h-3 w-3" />{e.phone}</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
