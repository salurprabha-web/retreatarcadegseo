"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const pageId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [schemaJson, setSchemaJson] = useState("{}");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      const res = await fetch(`/api/admin/location-pages?id=${pageId}`);
      const json = await res.json();

      if (!json.data) throw new Error("Not found");

      const p = json.data;

      setTitle(p.title);
      setSlug(p.slug);
      setSeoTitle(p.seo_title || "");
      setSeoDescription(p.seo_description || "");
      setOverridePrice(p.override_price || "");
      setSchemaJson(JSON.stringify(p.schema_json || {}, null, 2));

    } catch (err) {
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges(e: any) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/location-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pageId,
          title,
          slug,
          seo_title: seoTitle,
          seo_description: seoDescription,
          override_price: overridePrice ? Number(overridePrice) : null,
          schema_json: schemaJson ? JSON.parse(schemaJson) : {},
        }),
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Location-Specific Page</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={saveChanges} className="space-y-5">

            <div>
              <Label>Page Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>

            <div>
              <Label>SEO Title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>

            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Override Price (optional)</Label>
              <Input
                type="number"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
              />
            </div>

            <div>
              <Label>Schema JSON</Label>
              <Textarea
                rows={8}
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
              />
            </div>

            <Button disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
