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

// ✅ Load ReactQuill dynamically for rich text editor
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
    is_tech_service: false,
    canonical_url: '',
    // ✅ NEW — same admin-controlled hero fields as the Edit page
    trust_badges_text: '',
    key_features_text: '',
    trust_strip_text: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    schema_json: '',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setForm((prev) => ({ ...prev, description: value }));
  };

  // ✅ Convert to Postgres array literal (for text[] columns)
  const processArrayField = (value: any) => {
    if (!value || typeof value !== 'string') return '{}';
    const items = value
      .split(/[\n,]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    return `{${items.join(',')}}`;
  };

  // ✅ Convert "icon|label|sub" lines into a jsonb array — identical
  // parsing logic to the Edit page, so content created here and edited
  // later behaves consistently.
  const processIconRows = (value: string) => {
    return (value || '')
      .split('\n')
      .map((line) => {
        const [icon, label, sub] = line.split('|').map((s) => s.trim());
        return icon && label ? { icon, label, sub: sub || '' } : null;
      })
      .filter(Boolean);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);

    const highlightsArray = processArrayField(form.highlights);
    const metaKeywordsArray = processArrayField(form.meta_keywords);

    // ✅ Parse the three hero content fields — only meaningful for tech
    // services, but harmless to compute either way; we null them out
    // below for non-tech services regardless.
    const trust_badges = (form.trust_badges_text || '')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const key_features = processIconRows(form.key_features_text);
    const trust_strip = processIconRows(form.trust_strip_text);

    // ✅ Parse schema_json safely — invalid JSON shouldn't block creation
    let schema_json = null;
    if (form.schema_json && form.schema_json.trim()) {
      try {
        schema_json = JSON.parse(form.schema_json);
      } catch {
        toast.error('Schema JSON is invalid — service will be saved without it.');
      }
    }

    const now = new Date();

    try {
      const { error } = await supabase.from('services').insert([
        {
          title: form.title.trim(),
          slug: form.slug.trim(),
          summary: form.summary.trim(),
          description: form.description,
          highlights: highlightsArray,
          image_url: form.image_url.trim(),
          price_from: form.is_tech_service ? null : (form.price_from ? parseFloat(form.price_from) : null),
          is_tech_service: form.is_tech_service,
          canonical_url: form.canonical_url.trim() || null,

          // ✅ Hero content — only saved for tech services, null otherwise,
          // identical convention to the Edit page so data stays consistent
          trust_badges: form.is_tech_service ? trust_badges : null,
          key_features: form.is_tech_service ? key_features : null,
          trust_strip: form.is_tech_service ? trust_strip : null,

          // ✅ Tech services never carry related_event_ids
          related_event_ids: form.is_tech_service ? [] : [],

          // ✅ SEO fields
          meta_title: form.meta_title.trim(),
          meta_description: form.meta_description.trim(),
          meta_keywords: metaKeywordsArray,
          schema_json,

          // ✅ Status & timestamps
          status: 'published',
          published_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ]);

      if (error) {
        console.error('Supabase insert error:', error);
        toast.error('Failed to create service: ' + error.message);
      } else {
        toast.success('✅ Service created and published successfully!');
        router.push('/admin/services');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong');
    }

    setSaving(false);
  };

  const isTechService = form.is_tech_service;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Service</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange}
            placeholder="e.g., 360° Photobooth Rental" required />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" value={form.slug} onChange={handleChange}
            placeholder="e.g., 360-photobooth-rental" required />
          <p className="text-xs text-gray-400 mt-1">
            Canonical URL will be: https://www.retreatarcade.in/services/{form.slug || '...'}
          </p>
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" value={form.summary} onChange={handleChange}
            placeholder="Short summary about the service" />
        </div>

        <div>
          <Label htmlFor="description">Description (HTML)</Label>
          <ReactQuill theme="snow" value={form.description} onChange={handleDescriptionChange} />
          <p className="text-xs text-gray-400 mt-1">
            Use H2 headings for "Core Features", "How It Works", "Perfect For" — these are automatically parsed into styled sections on tech service pages.
          </p>
        </div>

        <div>
          <Label htmlFor="highlights">Highlights (comma or one per line)</Label>
          <Textarea id="highlights" name="highlights" value={form.highlights} onChange={handleChange}
            placeholder={`Example:\nPerfect for weddings\nInstant prints\nCustom branding`} />
        </div>

        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input id="image_url" name="image_url" value={form.image_url} onChange={handleChange}
            placeholder="https://example.com/image.jpg" />
        </div>

        {/* ✅ Tech/software service flag — controls everything below */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <input
            type="checkbox" id="is_tech_service"
            checked={form.is_tech_service}
            onChange={(e) => setForm({ ...form, is_tech_service: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer"
          />
          <div>
            <Label htmlFor="is_tech_service" className="text-sm font-semibold text-blue-900 cursor-pointer">
              This is a Technology Service (no fixed price)
            </Label>
            <p className="text-xs text-blue-700 mt-0.5">
              Check this for software, website, app, or custom-build services — e.g. Event Registration Software, Event Website Build. Shows a "Get a Custom Quote" CTA, uses the dedicated tech-service template, and unlocks the hero content fields below.
            </p>
          </div>
        </div>

        {/* ✅ NEW — Hero Section Content, tech-service-only, exact parity
            with the Edit page */}
        {isTechService && (
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-5 space-y-5">
            <p className="text-sm font-semibold text-blue-900">Hero Section Content</p>
            <p className="text-xs text-blue-700 -mt-3">
              These control the trust badges, the "What You Get" panel, and the bottom trust strip shown on the live page. Write content that's actually true for what this specific service does.
            </p>

            <div>
              <Label htmlFor="trust_badges_text">Trust Badges (comma-separated, 3 recommended)</Label>
              <Input
                id="trust_badges_text" name="trust_badges_text"
                value={form.trust_badges_text} onChange={handleChange}
                placeholder="e.g. 1-3 week builds, Secure & compliant, Fully custom"
              />
              <p className="text-xs text-gray-400 mt-1">Shown as small labels under the CTA buttons. Leave blank to hide this row entirely.</p>
            </div>

            <div>
              <Label htmlFor="key_features_text">"What You Get" Panel (one per line: icon|label|sub)</Label>
              <Textarea
                id="key_features_text" name="key_features_text" rows={4}
                value={form.key_features_text} onChange={handleChange}
                placeholder={'qrcode|QR Check-In|Scan-and-go entry\nchart|Live Dashboard|Real-time attendee data\nmail|Auto Comms|Confirmations & reminders'}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-400 mt-1">
                Format: <code className="bg-white px-1 rounded">icon|label|sub</code> — one feature per line, up to 3 shown.
                Available icons: <code className="bg-white px-1 rounded">qrcode, chart, mail, layers, calendar, users, lock, mobile, globe, settings, sparkles, shield, clock, code, zap</code>.
                Leave blank to hide this panel entirely.
              </p>
            </div>

            <div>
              <Label htmlFor="trust_strip_text">Trust Strip — bottom dark band (one per line: icon|label|sub)</Label>
              <Textarea
                id="trust_strip_text" name="trust_strip_text" rows={4}
                value={form.trust_strip_text} onChange={handleChange}
                placeholder={'zap|Fast Turnaround|Most builds launch in 1-3 weeks\nshield|Secure by Default|PCI-compliant payments, data privacy\ncode|Fully Custom|Built for your event, not a template'}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-400 mt-1">
                Same format as above. This is the 3-column trust band near the bottom of the page. Leave blank to hide it entirely.
              </p>
            </div>
          </div>
        )}

        {/* ✅ Starting Price — hidden for tech services, same as Edit page */}
        {!isTechService && (
          <div>
            <Label htmlFor="price_from">Starting Price (₹)</Label>
            <Input
              id="price_from" name="price_from" type="number"
              value={form.price_from} onChange={handleChange}
              placeholder="e.g., 3500"
            />
          </div>
        )}

        {/* ✅ Note replacing Related Events for tech services — Related
            Events itself doesn't exist on the New page (events are linked
            after creation, via Edit), so we only need the explanatory note */}
        {isTechService && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-600">
              <strong>No manual product linking needed.</strong> After creating this service, it will automatically cross-link to other Technology Services and to a curated set of complementary event products on the live page.
            </p>
          </div>
        )}

        {/* ✅ SEO FIELDS */}
        <div className="border-t border-gray-300 pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" value={form.meta_title} onChange={handleChange}
                placeholder="SEO optimized title" />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" value={form.meta_description} onChange={handleChange}
                placeholder="Short SEO-friendly description (under 160 chars)" />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Textarea id="meta_keywords" name="meta_keywords" value={form.meta_keywords} onChange={handleChange}
                placeholder={`Example:\nphoto booth, event rental, 360 video booth`} />
            </div>

            {/* ✅ NEW — Canonical URL, same as Edit page */}
            <div>
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url" name="canonical_url"
                value={form.canonical_url} onChange={handleChange}
                placeholder={`https://www.retreatarcade.in/services/${form.slug || '...'}`}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to default to the standard URL shown above.</p>
            </div>

            <div>
              <Label htmlFor="schema_json">Schema JSON (for structured data)</Label>
              <Textarea
                id="schema_json" name="schema_json" rows={8} className="font-mono text-xs"
                value={form.schema_json} onChange={handleChange}
                placeholder={isTechService
                  ? `{\n  "@context": "https://schema.org",\n  "@graph": [\n    { "@type": "SoftwareApplication", "name": "...", "applicationCategory": "BusinessApplication" },\n    { "@type": "BreadcrumbList", "itemListElement": [...] }\n  ]\n}`
                  : `{\n  "@context": "https://schema.org",\n  "@type": "Service",\n  "name": "Example Service"\n}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                {isTechService
                  ? 'For tech services: use SoftwareApplication + BreadcrumbList. FAQ schema is generated automatically — do not duplicate it here.'
                  : 'Leave blank to auto-generate Service schema from the fields above.'}
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="mt-6 w-full">
          {saving ? 'Saving...' : 'Create & Publish Service'}
        </Button>
      </form>
    </div>
  );
}
