"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LocationPage = {
  id: string;
  product_type: "event" | "service";
  product_id: string;
  location_id: string;
  title: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  is_active: boolean;
  created_at: string;

  // enriched fields from API
  product_name?: string;
  location_name?: string;
};

export default function AdminLocationPages() {
  const [pages, setPages] = useState<LocationPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const res = await fetch("/api/admin/location-pages");
      const json = await res.json();

      if (json.error) {
        toast.error(json.error);
        return;
      }

      setPages(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load location pages");
    } finally {
      setLoading(false);
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this location page?")) return;

    try {
      const res = await fetch(`/api/admin/location-pages?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      toast.success("Deleted successfully");
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Location-Specific Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm">
              These pages are automatically created or manually added for SEO
              targeting different locations.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <p>Loading...</p>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No location pages created yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pages.map((p) => (
              <Card key={p.id} className="border border-gray-200">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Product:</strong>{" "}
                        {p.product_name || "Unknown Product"}
                        <br />
                        <strong>Location:</strong>{" "}
                        {p.location_name || "Unknown Location"}
                        <br />
                        <strong>Slug:</strong> /{p.product_type}s/{p.slug}
                      </p>

                      {p.seo_title && (
                        <p className="mt-2 text-sm text-green-700">
                          <strong>SEO Title:</strong> {p.seo_title}
                        </p>
                      )}

                      {p.seo_description && (
                        <p className="text-sm text-green-700">
                          <strong>SEO Description:</strong>{" "}
                          {p.seo_description}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      onClick={() => deletePage(p.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
