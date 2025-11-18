"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X } from "lucide-react";

type Props = {
  params: { id: string; locationId: string };
};

export default function LocationSeoPage({ params }: Props) {
  const { id: serviceId, locationId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // SEO fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // OpenGraph / Twitter
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");

  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");

  // Schema JSON editor
  const [schemaJsonText, setSchemaJsonText] = useState<string>("{}");
  const [schemaValid, setSchemaValid] = useState(true);

  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const schemaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    loadSeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function autosize(el?: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function loadSeo() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/get-location-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, location_id: locationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Load SEO error:", data);
        toast.error("Failed to load SEO data");
        setLoading(false);
        return;
      }

      const seo = data.seo || {};

      setMetaTitle(seo.meta_title || "");
      setMetaDescription(seo.meta_description || "");
      setKeywords(Array.isArray(seo.meta_keywords) ? seo.meta_keywords : seo.meta_keywords || []);
      setCanonicalUrl(seo.canonical_url || "");

      setOgTitle(seo.og_title || "");
      setOgDescription(seo.og_description || "");
      setOgImage(seo.og_image || "");

      setTwitterTitle(seo.twitter_title || "");
      setTwitterDescription(seo.twitter_description || "");

      const schema = seo.schema_json ? JSON.stringify(seo.schema_json, null, 2) : "{}";
      setSchemaJsonText(schema);
      setSchemaValid(true);

      // autosize description textarea after setting value
      setTimeout(() => autosize(descRef.current), 0);
    } catch (err) {
      console.error(err);
      toast.error("Error loading SEO");
    } finally {
      setLoading(false);
    }
  }

  function handleKeywordKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput.trim());
    }
    if (e.key === "Backspace" && !keywordInput) {
      // remove last
      setKeywords((k) => k.slice(0, -1));
    }
  }

  function addKeyword(k?: string) {
    const trimmed = (k ?? keywordInput).trim();
    if (!trimmed) return setKeywordInput("");
    if (keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    setKeywords((prev) => [...prev, trimmed]);
    setKeywordInput("");
  }

  function removeKeyword(i: number) {
    setKeywords((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSchemaChange(v: string) {
    setSchemaJsonText(v);
    try {
      JSON.parse(v);
      setSchemaValid(true);
    } catch (e) {
      setSchemaValid(false);
    }
    autosize(schemaRef.current);
  }

  async function saveSeo() {
    if (!serviceId || !locationId) return toast.error("Missing parameters");
    if (!schemaValid) return toast.error("Schema JSON is invalid");

    setSaving(true);

    const seoPayload = {
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      meta_keywords: keywords,
      canonical_url: canonicalUrl || null,
      schema_json: JSON.parse(schemaJsonText || "{}"),
      og_title: ogTitle || null,
      og_description: ogDescription || null,
      og_image: ogImage || null,
      twitter_title: twitterTitle || null,
      twitter_description: twitterDescription || null,
    };

    try {
      const res = await fetch("/api/admin/save-location-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, location_id: locationId, seo: seoPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Save SEO error:", data);
        toast.error("Failed to save SEO");
        return;
      }

      toast.success("SEO saved");
    } catch (err) {
      console.error(err);
      toast.error("Error saving SEO");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Location SEO — Admin</h1>
          <p className="text-sm text-gray-600">Service-level SEO for this specific city</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/services/${serviceId}/locations/${locationId}`}>
            <Button variant="outline">← Back to Location</Button>
          </Link>
          <Button onClick={saveSeo} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
            {saving ? "Saving..." : "Save SEO"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: basic meta + OG */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Meta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Location-specific meta title" />
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    ref={descRef}
                    value={metaDescription}
                    onChange={(e) => { setMetaDescription(e.target.value); autosize(descRef.current); }}
                    onInput={() => autosize(descRef.current)}
                    placeholder="Short description used in meta description (max 160 chars)"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">Length: {metaDescription.length} / 160</p>
                </div>

                <div>
                  <Label>Meta Keywords</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {keywords.map((k, i) => (
                      <div key={k} className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm">
                        <span className="mr-2">{k}</span>
                        <button onClick={() => removeKeyword(i)} aria-label="remove keyword"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <input
                      className="min-w-[120px] border rounded px-2 py-1 text-sm"
                      placeholder="Type and press Enter"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKey}
                      onBlur={() => addKeyword()}
                    />
                  </div>
                </div>

                <div>
                  <Label>Canonical URL</Label>
                  <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://www.example.com/services/xyz/hyderabad" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Graph / Twitter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>OG Title</Label>
                  <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} />
                </div>

                <div>
                  <Label>OG Description</Label>
                  <Textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} rows={3} />
                </div>

                <div>
                  <Label>OG Image URL</Label>
                  <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
                </div>

                <div>
                  <Label>Twitter Title</Label>
                  <Input value={twitterTitle} onChange={(e) => setTwitterTitle(e.target.value)} />
                </div>

                <div>
                  <Label>Twitter Description</Label>
                  <Textarea value={twitterDescription} onChange={(e) => setTwitterDescription(e.target.value)} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Schema JSON + Preview */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schema Markup (JSON-LD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Schema JSON</Label>
                <Textarea
                  ref={schemaRef}
                  value={schemaJsonText}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  onInput={() => autosize(schemaRef.current)}
                  rows={10}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className={schemaValid ? "text-green-600" : "text-red-600"}>
                      {schemaValid ? "Valid JSON" : "Invalid JSON"}
                    </span>
                    <div className="text-xs text-gray-500">Schema should be a valid JSON-LD object to be injected on frontend.</div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // generate a simple Service schema as starter
                        const example = {
                          "@context": "https://schema.org",
                          "@type": "Service",
                          name: metaTitle || undefined,
                          description: metaDescription || undefined,
                          provider: {
                            "@type": "Organization",
                            name: "Retreat Arcade",
                            url: "https://www.retreatarcade.in",
                          },
                        };
                        const txt = JSON.stringify(example, null, 2);
                        setSchemaJsonText(txt);
                        setSchemaValid(true);
                        setTimeout(() => autosize(schemaRef.current), 0);
                      }}
                    >
                      Generate Starter Schema
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded p-4">
                  <p className="text-sm text-gray-500">Meta preview (search result)</p>
                  <h3 className="text-lg text-blue-700 hover:underline">{metaTitle || `${"[Service]"} — ${"[Location]"}`}</h3>
                  <p className="text-sm text-gray-700 mt-2">{metaDescription || "No meta description set."}</p>
                  <p className="text-xs text-gray-500 mt-2">{canonicalUrl || "Canonical not set"}</p>
                </div>

                <div className="border rounded p-4">
                  <p className="text-sm text-gray-500">Social preview (OpenGraph)</p>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-16 bg-gray-100 flex items-center justify-center">{ogImage ? <img src={ogImage} alt="OG" className="object-cover w-full h-full"/> : <span className="text-xs text-gray-400">No image</span>}</div>
                    <div>
                      <p className="font-medium">{ogTitle || metaTitle || "OG Title"}</p>
                      <p className="text-sm text-gray-600">{ogDescription || metaDescription || "OG Description"}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded p-4">
                  <p className="text-sm text-gray-500">Keywords</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.length ? keywords.map((k) => (
                      <span key={k} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{k}</span>
                    )) : <span className="text-xs text-gray-400">No keywords</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
