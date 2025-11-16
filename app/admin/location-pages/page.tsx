"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import { Trash, Edit, Copy, Plus, ExternalLink } from "lucide-react";

type Location = {
  id: string;
  name?: string;
  city?: string;
  slug?: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  product_type: "event" | "service";
};

type LocationPage = {
  id: string;
  product_id: string;
  product_type: string;
  location_id: string;
  title: string;
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  product?: Product | null;
  location?: Location | null;
};

export default function AdminLocationPages() {
  const [pages, setPages] = useState<LocationPage[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    location_id: "",
    title: "",
    seo_title: "",
    seo_description: ""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAGE_SIZE = 12;

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pagesRes, locRes, prodRes] = await Promise.all([
        fetch("/api/admin/location-pages").then((r) => r.json()),
        fetch("/api/admin/locations").then((r) => r.json()),
        fetch("/api/admin/products-for-locations").then((r) => r.json())
      ]);

      setPages(pagesRes?.data || []);
      setLocations(locRes?.data || []);
      setProducts(prodRes?.data || []);
    } catch (err) {
      toast.error("Failed to load admin data");
      console.error(err);
    }
    setLoading(false);
  }

  function openModal() {
    setForm({
      product_id: "",
      location_id: "",
      title: "",
      seo_title: "",
      seo_description: ""
    });
    setIsModalOpen(true);
  }

  async function savePage(e: any) {
    e.preventDefault();
    if (!form.product_id || !form.location_id) {
      toast.error("Select product & location");
      return;
    }

    const res = await fetch("/api/admin/location-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed");
      return;
    }

    toast.success("Page created");
    setIsModalOpen(false);
    loadAll();
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Location Pages</h1>
          <Button onClick={openModal}>
            <Plus className="h-4 w-4 mr-2" /> New Page
          </Button>
        </div>

        {/* Products & Pages List */}
        <Card>
          <CardHeader>
            <CardTitle>Pages ({pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {!loading && pages.length === 0 && (
              <p className="text-gray-500 text-sm">No pages found.</p>
            )}

            <div className="space-y-3">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center p-3 bg-white rounded shadow-sm"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.product?.title} · {p.location?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center pt-20 z-50">
            <div className="bg-white w-full max-w-lg rounded p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Create Location Page</h2>

              <form onSubmit={savePage} className="space-y-4">
                <div>
                  <Label>Product</Label>
                  <Select
                    value={form.product_id}
                    onValueChange={(v) =>
                      setForm((s) => ({ ...s, product_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.product_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Location</Label>
                  <Select
                    value={form.location_id}
                    onValueChange={(v) =>
                      setForm((s) => ({ ...s, location_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, title: e.target.value }))
                    }
                  />
                </div>

                <Button type="submit">Save</Button>
              </form>

              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
