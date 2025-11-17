"use client";

import { useEffect, useState } from "react";

export default function SEOOverrides({ params }: any) {
  const { service_id, location_id } = params;

  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/get-service-location-link?service_id=${service_id}&location_id=${location_id}`
      );
      const link = await res.json();
      setData(link.seo_overrides_json || {});
      setLoading(false);
    }
    load();
  }, [service_id, location_id]);

  const save = async () => {
    await fetch("/api/admin/update-seo-overrides", {
      method: "POST",
      body: JSON.stringify({
        service_id,
        location_id,
        seo_overrides_json: data,
      }),
    });

    alert("SEO Overrides Updated!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl mb-6">SEO Overrides</h1>

      <label className="block mb-4">
        <p>Meta Title</p>
        <input
          className="border p-2 w-full"
          value={data.meta_title || ""}
          onChange={(e) => setData({ ...data, meta_title: e.target.value })}
        />
      </label>

      <label className="block mb-4">
        <p>Meta Description</p>
        <textarea
          className="border p-2 w-full"
          value={data.meta_description || ""}
          onChange={(e) =>
            setData({ ...data, meta_description: e.target.value })
          }
        />
      </label>

      <button
        onClick={save}
        className="mt-6 px-6 py-3 bg-orange-600 text-white rounded"
      >
        Save SEO
      </button>
    </div>
  );
}
