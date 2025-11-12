'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ✅ ensure only ONE supabase client file exists
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// ✅ Load ReactQuill dynamically (for HTML editor)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function EditServicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<any>(null);

  // ✅ Fetch existing service data
  useEffect(() => {
    async function fetchService() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching service:', error);
        toast.error('Failed to fetch service details');
        router.push('/admin/services');
        return;
      }

      // ✅ Convert Postgres arrays to multiline strings for editing
      setService({
        ...data,
        highlights: Array.isArray(data.highlights)
          ? data.highlights.join('\n')
          : data.highlights || '',
        meta_keywords: Array.isArray(data.meta_keywords)
          ? data.meta_keywords.join(', ')
          : data.meta_keywords || '',
      });

      setLoading(false);
    }

    fetchService();
  }, [params.id, router]);

  // ✅ Handle field change
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setService((prev: any) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle schema input (textarea)
  const handleSchemaChange = (value: string) => {
    setService((prev: any) => ({ ...prev, schema_json: value }));
  };

  // ✅ Handle HTML description
  const handleDescriptionChange = (value: string) => {
    setService((prev: any) => ({ ...prev, description: value }));
  };

  // ✅ Convert to Postgres array literal
  const processArrayField = (value: any) => {
    if (!value || typeof value !== 'string') return '{}';
    const items = value
      .split(/[\n,]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    return `{${items.join(',')}}`;
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const highlightsArray = processArrayField(service.highlights);
      const metaKeywordsArray = processArrayField(service.meta_keywords);

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('services')
        .update({
          title: service.title,
          slug: service.slug,
          summary: service.summary,
          description: service.description,
          highlights: highlightsArray,
          image_url: service.image_url,
          price_from: service.price_from
            ? parseFloat(service.price_from)
            : null,
          meta_title: service.meta_title,
          meta_description: service.meta_description,
          meta_keywords: metaKeywordsArray,
          schema_json: service.schema_json,
          updated_at: now,
          status: 'published', // ✅ auto-publish when editing
          published_at: service.published_at || now, // ✅ ensure non-null
        })
        .eq('id', params.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update service: ' + error.message);
      } else {
        toast.success('✅ Service updated successfully');
        router.push('/admin/services');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong');
    }

    setSaving(false);
  };

  if (loading) {
    return <p className="text-center py-10">Loading service details...</p>;
  }

  if (!service) {
    return <p className="text-center py-10 text-red-500">Service not found.</p>;
  }

  // ✅ Render Form
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Service</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={service.title || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={service.slug || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            value={service.summary || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="description">Description (HTML)</Label>
          <ReactQuill
            theme="snow"
            value={service.description || ''}
            onChange={handleDescriptionChange}
          />
        </div>

        <div>
          <Label htmlFor="highlights">Highlights (one per line)</Label>
          <Textarea
            id="highlights"
            name="highlights"
            value={service.highlights || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            name="image_url"
            value={service.image_url || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="price_from">Starting Price (₹)</Label>
          <Input
            id="price_from"
            name="price_from"
            type="number"
            value={service.price_from || ''}
            onChange={handleChange}
          />
        </div>

        {/* ✅ SEO Fields */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                name="meta_title"
                value={service.meta_title || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={service.meta_description || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords (comma or newline)</Label>
              <Textarea
                id="meta_keywords"
                name="meta_keywords"
                value={service.meta_keywords || ''}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="schema_json">Schema JSON</Label>
              <Textarea
                id="schema_json"
                name="schema_json"
                rows={8}
                value={
                  typeof service.schema_json === 'string'
                    ? service.schema_json
                    : JSON.stringify(service.schema_json || {}, null, 2)
                }
                onChange={(e) => handleSchemaChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-6 w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
