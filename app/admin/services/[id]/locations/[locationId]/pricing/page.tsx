"use client";

import { useEffect, useState } from "react";

export default function PricingPage({ params }: { params: { id: string; locationId: string } }) {
  const { id: serviceId, locationId } = params;
  const [price, setPrice] = useState<any>({ min: "", max: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/get-service-location-link?service_id=${serviceId}&location_id=${locationId}`);
      const link = await res.json();
      setPrice(link?.pricing_json || { min: "", max: "" });
      setLoading(false);
    }
    load();
  }, [serviceId, locationId]);

  const save = async () => {
    await fetch("/api/admin/update-pricing", {
      method: "POST",
      body: JSON.stringify({ service_id: serviceId, location_id: locationId, pricing_json: price }),
    });
    alert("Saved pricing");
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Location Pricing</h2>

      <label className="block mb-3">
        <div>Min Price (INR)</div>
        <input className="border p-2 w-full" value={price.min || ""} onChange={(e)=>setPrice({...price, min: e.target.value})} />
      </label>

      <label className="block mb-3">
        <div>Max Price (INR)</div>
        <input className="border p-2 w-full" value={price.max || ""} onChange={(e)=>setPrice({...price, max: e.target.value})} />
      </label>

      <button onClick={save} className="mt-4 px-5 py-2 bg-orange-600 text-white rounded">Save</button>
    </div>
  );
}
