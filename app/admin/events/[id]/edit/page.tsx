'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/supabase-client";
import { supabase } from "@/lib/supabase";

// ✅ FIX: This was previously a clone of the NEW event page.
// It now correctly: reads the event id from params, fetches
// existing data, pre-fills the form, and uses UPDATE not INSERT.

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { session } = await getSession();
      if (!session) { router.push("/admin"); return; }
      if (id) await fetchEvent(id);
    }
    init();
  }, [id]);

  async function fetchEvent(eventId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      toast.error("Event not found");
      router.push("/admin/events");
      return;
    }
    setEvent(data);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    const galleryImages = (formData.get("gallery_images") as string || "")
      .split("\n").map((u) => u.trim()).filter(Boolean);

    const highlights = (formData.get("highlights") as string || "")
      .split("\n").map((h) => h.trim()).filter(Boolean);

    const keywords = (formData.get("meta_keywords") as string || "")
      .split(",").map((k) => k.trim()).filter(Boolean);

    // Parse schema_json safely
    let schemaJson = event.schema_json || {};
    const schemaRaw = (formData.get("schema_json") as string || "").trim();
    if (schemaRaw) {
      try { schemaJson = JSON.parse(schemaRaw); }
      catch { toast.error("Schema JSON is invalid — saved without it"); }
    }

    const updateData: any = {
      title,
      summary: formData.get("summary"),
      description: formData.get("description"),
      category: formData.get("category"),
      price: Number(formData.get("price")) || null,
      image_url: formData.get("image_url"),
      gallery_images: galleryImages,
      highlights,
      is_featured: formData.get("is_featured") === "on",
      status: formData.get("status") as string || "published",
      meta_title: formData.get("meta_title"),
      meta_description: formData.get("meta_description"),
      meta_keywords: keywords,
      canonical_url: formData.get("canonical_url"),
      schema_json: schemaJson,
      updated_at: new Date().toISOString(),
    };

    // ✅ UPDATE — not insert
    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update event: " + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Event updated successfully!");
    router.push("/admin/events");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading event...
        </div>
      </div>
    );
  }

  const galleryStr = Array.isArray(event.gallery_images)
    ? event.gallery_images.join("\n")
    : "";

  const highlightsStr = Array.isArray(event.highlights)
    ? event.highlights.join("\n")
    : "";

  const keywordsStr = Array.isArray(event.meta_keywords)
    ? event.meta_keywords.join(", ")
    : (event.meta_keywords || "");

  const schemaStr = event.schema_json
    ? JSON.stringify(event.schema_json, null, 2)
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Retreat Arcade</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Edit Event</span>
            </div>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event — {event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <Label>Title</Label>
                <Input name="title" required defaultValue={event.title} />
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea name="summary" rows={3} defaultValue={event.summary || ""} />
              </div>

              <div>
                <Label>Description (HTML Allowed)</Label>
                <Textarea name="description" rows={10} defaultValue={event.description || ""} />
              </div>

              <div>
                <Label>Category</Label>
                <Input name="category" defaultValue={event.category || ""} placeholder="e.g. Photobooth" />
              </div>

              <div>
                <Label>Main Image URL</Label>
                <Input name="image_url" defaultValue={event.image_url || ""} />
                {event.image_url && (
                  <img src={event.image_url} alt="Current" className="mt-2 h-24 object-contain rounded border" />
                )}
              </div>

              <div>
                <Label>Gallery Images (one URL per line)</Label>
                <Textarea name="gallery_images" rows={4} defaultValue={galleryStr} />
              </div>

              <div>
                <Label>Highlights (one per line)</Label>
                <Textarea name="highlights" rows={6} defaultValue={highlightsStr} />
              </div>

              <div>
                <Label>Price (₹)</Label>
                <Input name="price" type="number" defaultValue={event.price || ""} />
              </div>

              <div>
                <Label>Status</Label>
                <select
                  name="status"
                  defaultValue={event.status || "published"}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* SEO Section */}
              <div className="pt-6 border-t">
                <h2 className="text-lg font-semibold text-gray-900">SEO Settings</h2>
                <p className="text-sm text-gray-500 mt-1">These fields control how this page appears in Google.</p>
              </div>

              <div>
                <Label>Meta Title</Label>
                <Input name="meta_title" defaultValue={event.meta_title || ""} />
                <p className="text-xs text-gray-400 mt-1">Keep under 60 characters</p>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea name="meta_description" rows={3} defaultValue={event.meta_description || ""} />
                <p className="text-xs text-gray-400 mt-1">Keep under 160 characters</p>
              </div>

              <div>
                <Label>Meta Keywords (comma separated)</Label>
                <Input name="meta_keywords" defaultValue={keywordsStr} />
              </div>

              <div>
                <Label>Canonical URL</Label>
                <Input name="canonical_url" defaultValue={event.canonical_url || `https://www.retreatarcade.in/events/${event.slug}`} />
              </div>

              <div>
                <Label>Schema JSON</Label>
                <Textarea name="schema_json" rows={8} defaultValue={schemaStr}
                  className="font-mono text-xs"
                  placeholder='{"@context":"https://schema.org","@type":"Service",...}' />
                <p className="text-xs text-gray-400 mt-1">Must be valid JSON. Leave blank to auto-generate.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  id="is_featured"
                  defaultChecked={event.is_featured}
                />
                <Label htmlFor="is_featured">Mark as Featured</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="bg-orange-500 hover:bg-orange-600">
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : "Save Changes"}
                </Button>
                <Link href="/admin/events">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
