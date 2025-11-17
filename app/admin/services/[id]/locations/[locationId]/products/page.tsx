"use client";

import { useEffect, useState } from "react";

export default function AssignProducts({ params }: { params: { id: string; locationId: string } }) {
  const { id: serviceId, locationId } = params;
  const [products, setProducts] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prodRes, linkRes] = await Promise.all([
        fetch("/api/admin/get-products"),
        fetch(`/api/admin/get-service-location-link?service_id=${serviceId}&location_id=${locationId}`)
      ]);
      const prodData = await prodRes.json();
      const linkData = await linkRes.json();

      setProducts(prodData || []);
      setAssigned(linkData?.products_json || []);
      setLoading(false);
    }
    load();
  }, [serviceId, locationId]);

  const toggle = (p: any) => {
    setAssigned((prev) => (prev.some(x => x.slug === p.slug) ? prev.filter(x => x.slug !== p.slug) : [...prev, p]));
  };

  const save = async () => {
    await fetch("/api/admin/update-products-per-location", {
      method: "POST",
      body: JSON.stringify({ service_id: serviceId, location_id: locationId, products_json: assigned }),
    });
    alert("Products saved");
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl mb-4">Assign Products for {locationId}</h2>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p: any) => (
          <label key={p.id} className="flex items-center gap-3 border p-3 rounded">
            <input type="checkbox" checked={assigned.some((a:any)=>a.slug===p.slug)} onChange={() => toggle(p)} />
            <span>{p.title}</span>
          </label>
        ))}
      </div>

      <button onClick={save} className="mt-6 px-5 py-2 bg-orange-600 text-white rounded">Save Products</button>
    </div>
  );
}
