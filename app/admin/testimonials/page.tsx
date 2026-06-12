'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Testimonial = {
  id: string;
  client_name: string;
  client_title: string;
  content: string;
  rating: number;
  is_featured: boolean;
  display_order: number;
};

const emptyForm = { client_name: '', client_title: '', content: '', rating: 5, is_featured: true, display_order: 0 };

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { session } = await getSession();
    if (!session) { router.push('/admin'); return; }
    await fetchList();
    setLoading(false);
  }

  async function fetchList() {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true });
    setList(data || []);
  }

  function startEdit(t: Testimonial) {
    setEditId(t.id);
    setForm({ client_name: t.client_name, client_title: t.client_title || '', content: t.content, rating: t.rating || 5, is_featured: t.is_featured, display_order: t.display_order || 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.client_name.trim() || !form.content.trim()) {
      toast.error('Name and testimonial content are required');
      return;
    }
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };

    if (editId) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Testimonial updated');
    } else {
      const { error } = await supabase.from('testimonials').insert({ ...payload, created_at: new Date().toISOString() });
      if (error) { toast.error('Failed to save'); setSaving(false); return; }
      toast.success('Testimonial added');
    }

    setEditId(null);
    setForm(emptyForm);
    setSaving(false);
    await fetchList();
  }

  async function toggleFeatured(t: Testimonial) {
    await supabase.from('testimonials').update({ is_featured: !t.is_featured }).eq('id', t.id);
    await fetchList();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    toast.success('Deleted');
    await fetchList();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">Testimonials</span>
          </div>
          <Link href="/admin/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button></Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Add / Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>{editId ? 'Edit Testimonial' : 'Add New Testimonial'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input placeholder="e.g. Priya Sharma" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Title / Company</Label>
                <Input placeholder="e.g. HR Manager, Infosys" value={form.client_title} onChange={e => setForm(p => ({ ...p, client_title: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Testimonial *</Label>
              <Textarea rows={4} placeholder="What did the client say about your service?" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rating (1–5)</Label>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setForm(p => ({ ...p, rating: n }))}>
                      <Star className={`h-7 w-7 transition ${n <= form.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" min={0} value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: Number(e.target.value) }))} />
                <p className="text-xs text-gray-500">Lower = shown first</p>
              </div>
              <div className="space-y-2">
                <Label>Show on Homepage</Label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, is_featured: !p.is_featured }))}
                    className={`relative w-12 h-6 rounded-full transition ${form.is_featured ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_featured ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-sm text-gray-600">{form.is_featured ? 'Featured' : 'Hidden'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                {saving ? 'Saving...' : editId ? 'Update Testimonial' : 'Add Testimonial'}
              </Button>
              {editId && <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Testimonials ({list.length})</h2>
          {list.length === 0 && (
            <Card><CardContent className="py-12 text-center text-gray-500">No testimonials yet. Add your first one above.</CardContent></Card>
          )}
          {list.map(t => (
            <Card key={t.id} className={`border-l-4 ${t.is_featured ? 'border-l-orange-500' : 'border-l-gray-200'}`}>
              <CardContent className="py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{t.client_name}</span>
                    {t.client_title && <span className="text-sm text-gray-500">· {t.client_title}</span>}
                    {t.is_featured && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                  <div className="flex mb-2">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm italic">"{t.content}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toggleFeatured(t)} title={t.is_featured ? 'Hide from homepage' : 'Show on homepage'}>
                    {t.is_featured ? <Eye className="h-4 w-4 text-orange-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
