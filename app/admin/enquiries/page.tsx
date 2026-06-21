'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [router]);

  async function init() {
    const { session } = await getSession();
    if (!session) { router.push('/admin'); return; }
    await fetchEnquiries();
  }

  async function fetchEnquiries() {
    const { data } = await supabase
      .from('contact_enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    setEnquiries(data || []);
    setIsLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete the enquiry from "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    const { error } = await supabase.from('contact_enquiries').delete().eq('id', id);

    if (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete enquiry. Please try again.');
      setDeletingId(null);
      return;
    }

    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    toast.success('Enquiry deleted');
    setDeletingId(null);
  }

  async function handleMarkContacted(id: string) {
    const { error } = await supabase
      .from('contact_enquiries')
      .update({ status: 'contacted' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'contacted' } : e)));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading enquiries...
        </div>
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
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
            <p className="text-gray-500">No enquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((e) => (
              <div
                key={e.id}
                className={`bg-white border rounded-2xl p-5 transition-opacity ${
                  e.status === 'contacted' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                } ${deletingId === e.id ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{e.name}</p>
                      {e.status === 'contacted' && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Contacted
                        </span>
                      )}
                    </div>
                    {e.event_type && <p className="text-xs text-orange-600">{e.event_type}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {e.status !== 'contacted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleMarkContacted(e.id)}
                        title="Mark as contacted"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(e.id, e.name)}
                      disabled={deletingId === e.id}
                      title="Delete"
                    >
                      {deletingId === e.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{e.message}</p>
                <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                  <a href={`mailto:${e.email}`} className="flex items-center gap-1 hover:text-orange-600"><Mail className="h-3 w-3" />{e.email}</a>
                  {e.phone && (
                    <a href={`https://wa.me/91${e.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600">
                      <Phone className="h-3 w-3" />{e.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
