"use client";

import { useEffect, useState } from "react";

export default function PricingPage({ params }: any) {
  const { service_id, location_id } = params;

  const [price, setPrice] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/admin/get-service-location-link?service_id=${service_id}&location_id=${location_id}`
      );
      const link = await res.json();
      setPrice(link.pricing_json || {});
      setLoading(false);
    }
    load();
  }, [service_id, location_id]);

  const save = async () => {
    await fetch("/api/admin/update-location-pricing", {
      method: "POST",
      body: JSON.stringify({
        service_id,
        location_id,
        pricing_json: price,
      }),
    });

    alert("Pricing Updated!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl mb-6">Location-specific Pricing</h1>

      <label className="block mb-4">
        <p>Min Price</p>
        <input
          className="border p-2 w-full"
          value={price.min || ""}
          onChange={(e) => setPrice({ ...price, min: e.target.value })}
        />
      </label>

      <label className="block mb-4">
        <p>Max Price</p>
        <input
          className="border p-2 w-full"
          value={price.max || ""}
          onChange={(e) => setPrice({ ...price, max: e.target.value })}
        />
      </label>

      <button
        onClick={save}
        className="mt-6 px-6 py-3 bg-orange-600 text-white"
      >
        Save Pricing
      </button>
    </div>
  );
}
