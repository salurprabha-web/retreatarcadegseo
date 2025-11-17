"use client";

import { useEffect, useState } from "react";

export default function SEOOverrides({ params }: { params: { id: string; locationId: string } }) {
  const { id: serviceId, locationId } = params;
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/get-service-location-link?service_id=${serviceId}&location_id=${locationId}`);
      const link = await res.json();
      setData(link?.seo_overrides_json || {});
      setLoading(false);
    }
    load();
  }, [serviceId, locationId]);

  const save = async () => {
    await fetch("/api/admin/update-seo", {
      method: "POST",
      body: JSON.stringify({ service_id: serviceId, location_id: locationId, seo_overrides_json: data }),
    });
    alert("Saved");
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">SEO Overrides</h2>

      <label className="block mb-3">
        <div>Meta Title</div>
        <input className="border p-2 w-full" value={data.meta_title || ""} onChange={(e)=>setData({...data, meta_title: e.target.value})} />
      </label>

      <label className="block mb-3">
        <div>Meta Description</div>
        <textarea className="border p-2 w-full" rows={4} value={data.meta_description || ""} onChange={(e)=>setData({...data, meta_description: e.target.value})}/>
      </label>

      <button onClick={save} className="mt-4 px-5 py-2 bg-orange-600 text-white rounded">Save SEO</button>
    </div>
  );
}
