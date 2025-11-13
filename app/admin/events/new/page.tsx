'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/supabase-client";
import { supabase } from "@/lib/supabase";

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { session } = await getSession();
    if (!session) router.push("/admin");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const galleryImages = (formData.get("gallery_images") as string || "")
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const highlights = (formData.get("highlights") as string || "")
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);

    const keywords = (formData.get("meta_keywords") as string || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const eventData: any = {
      title,
      slug,
      summary: formData.get("summary"),
      description: formData.get("description"),
      category: formData.get("category"),
      price: Number(formData.get("price")) || null,
      image_url: formData.get("image_url"),
      gallery_images: galleryImages,
      highlights,
      is_featured: formData.get("is_featured") === "on",
      status: "published",

      // SEO fields
      meta_title: formData.get("meta_title"),
      meta_description: formData.get("meta_description"),
      meta_keywords: keywords,
      canonical_url: formData.get("canonical_url"),
      schema_json: {},

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("events").insert(eventData);

    if (error) {
      toast.error("Failed to create event: " + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Event created successfully!");
    router.push("/admin/events");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">
                Nirvahana Utsav
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">New Event</span>
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
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div>
                <Label>Title</Label>
                <Input name="title" required />
              </div>

              {/* Summary */}
              <div>
                <Label>Summary</Label>
                <Textarea name="summary" rows={3} />
              </div>

              {/* Description (HTML Allowed) */}
              <div>
                <Label>Description (HTML Allowed)</Label>
                <Textarea name="description" rows={8} required />
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Input name="category" placeholder="Example: Photobooth" />
              </div>

              {/* Image URL */}
              <div>
                <Label>Main Image URL</Label>
                <Input name="image_url" />
              </div>

              {/* Gallery */}
              <div>
                <Label>Gallery Images (one URL per line)</Label>
                <Textarea name="gallery_images" rows={4} />
              </div>

              {/* Highlights */}
              <div>
                <Label>Highlights (one per line)</Label>
                <Textarea name="highlights" rows={4} />
              </div>

              {/* Price */}
              <div>
                <Label>Price</Label>
                <Input name="price" type="number" />
              </div>

              {/* Removed dates/location/duration/max_participants inputs */}

              {/* SEO Section */}
              <div className="pt-6 border-t">
                <h2 className="text-lg font-semibold">SEO Settings</h2>
              </div>

              <div>
                <Label>Meta Title</Label>
                <Input name="meta_title" />
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea name="meta_description" rows={3} />
              </div>

              <div>
                <Label>Meta Keywords (comma separated)</Label>
                <Input name="meta_keywords" />
              </div>

              <div>
                <Label>Canonical URL</Label>
                <Input name="canonical_url" />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_featured" />
                <Label>Mark as Featured</Label>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Create Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
