'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Load ReactQuill dynamically for rich text editor
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function NewServicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    description: '',
    highlights: '',
    image_url: '',
    price_from: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    schema_json: '',
  });

  // ✅ Handle input change
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle rich text editor
  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  };

  // ✅ Handle submit (insert new record)
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('services').insert([
        {
          title: form.title,
          slug: form.slug,
          summary: form.summary,
          description: form.description,
          highlights: form.highlights ? form.highlights.split('\n') : [],
          image_url: form.image_url,
          price_from: form.price_from ? parseFloat(form.price_from) : null,
          // SEO fields
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          meta_keywords: form.meta_keywords,
          schema_json: form.schema_json,
          created_at: new Date(),
        },
      ]);

      if (error) {
        console.error(error);
        toast.error('Failed to create service');
      } else {
        toast.success('Service added successfully');
        router.push('/admin/services');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    }

    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Service</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., 360° Photobooth Rental"
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="e.g., 360-photobooth-rental"
            required
          />
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Short summary about the service"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (HTML)</Label>
          <ReactQuill
            theme="snow"
            value={form.description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div>
          <Label htmlFor="highlights">Highlights (one per line)</Label>
          <Textarea
            id="highlights"
            name="highlights"
            value={form.highlights}
            onChange={handleChange}
            placeholder={`Example:\nPerfect for weddings\nInstant prints\nCustom branding`}
          />
        </div>

        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <Label htmlFor="price_from">Starting Price (₹)</Label>
          <Input
            id="price_from"
            name="price_from"
            type="number"
            value={form.price_from}
            onChange={handleChange}
            placeholder="e.g., 3500"
          />
        </div>

        {/* ✅ SEO FIELDS */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                name="meta_title"
                value={form.meta_title}
                onChange={handleChange}
                placeholder="SEO optimized title"
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                name="meta_description"
                value={form.meta_description}
                onChange={handleChange}
                placeholder="Short SEO-friendly description (under 160 chars)"
              />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                name="meta_keywords"
                value={form.meta_keywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            <div>
              <Label htmlFor="schema_json">Schema JSON (for structured data)</Label>
              <Textarea
                id="schema_json"
                name="schema_json"
                rows={8}
                value={form.schema_json}
                onChange={handleChange}
                placeholder={`{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Example Event",
  "description": "Structured data goes here"
}`}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-6 w-full">
          {saving ? 'Saving...' : 'Create Service'}
        </Button>
      </form>
    </div>
  );
}

