"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LocationPagesList() {
  const [pages, setPages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const res = await fetch("/api/admin/location-pages");
      const json = await res.json();
      setPages(json.data || []);
    } catch (e) {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  async function deletePage(id: string) {
    if (!confirm("Delete this location page?")) return;

    const res = await fetch(`/api/admin/location-pages?id=${id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (json.error) return toast.error(json.error);

    toast.success("Deleted");
    setPages((list) => list.filter((p) => p.id !== id));
  }

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Location-Specific Pages</CardTitle>
        </CardHeader>

        <CardContent>
          <Input
            placeholder="Search pages..."
            className="mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 && <p>No pages found.</p>}

          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white border rounded flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-500">
                    /{p.product_type}s/{p.product_slug}/{p.location_slug}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/location-pages/${p.id}`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>

                  <a
                    href={`/${p.product_type}s/${p.product_slug}/${p.location_slug}`}
                    target="_blank"
                  >
                    <Button size="sm" variant="secondary">Preview</Button>
                  </a>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePage(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
