"use client";

import { useEffect, useState } from "react";

export default function AssignProductsPage({ params }: any) {
  const { service_id, location_id } = params;

  const [products, setProducts] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const prodRes = await fetch("/api/admin/get-products");
      const prodData = await prodRes.json();

      const linkRes = await fetch(
        `/api/admin/get-service-location-link?service_id=${service_id}&location_id=${location_id}`
      );
      const linkData = await linkRes.json();

      setProducts(prodData);
      setAssigned(linkData?.products_json || []);
      setLoading(false);
    }
    fetchData();
  }, [service_id, location_id]);

  const toggleProduct = (p: any) => {
    const exists = assigned.find((a: any) => a.slug === p.slug);
    if (exists) {
      setAssigned(assigned.filter((x: any) => x.slug !== p.slug));
    } else {
      setAssigned([...assigned, p]);
    }
  };

  const save = async () => {
    await fetch("/api/admin/update-products-per-location", {
      method: "POST",
      body: JSON.stringify({
        service_id,
        location_id,
        products_json: assigned,
      }),
    });
    alert("Products updated!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl mb-6">Assign Products</h1>

      <div className="grid gap-4">
        {products.map((p) => (
          <label key={p.id} className="flex items-center gap-3 border p-3 rounded">
            <input
              type="checkbox"
              checked={assigned.some((x) => x.slug === p.slug)}
              onChange={() => toggleProduct(p)}
            />
            <span>{p.title}</span>
          </label>
        ))}
      </div>

      <button onClick={save} className="mt-6 px-6 py-3 bg-orange-600 text-white">
        Save Products
      </button>
    </div>
  );
}
