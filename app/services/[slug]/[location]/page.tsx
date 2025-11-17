"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LocationServicePage({ params }: any) {
  const router = useRouter();
  const { slug, location } = params;

  const serviceData = {/* fetch service from Supabase or props */};
  const productList = serviceData.products || [];

  const goToMasterProduct = (product: any) => {
    // 1. Update meta title before redirect
    document.title = `${product.title} in ${location} | Retreat Event Pvt Ltd`;

    // 2. Redirect to master product page
    router.push(`/services/${product.slug}`);
  };

  return (
    <div>
      <h1>{serviceData.title} in {location}</h1>

      <h2>Products available in {location}</h2>

      <div className="grid gap-4">
        {productList.map((product: any) => (
          <button
            key={product.slug}
            className="p-4 border rounded-lg"
            onClick={() => goToMasterProduct(product)}
          >
            {product.title} in {location}
          </button>
        ))}
      </div>
    </div>
  );
}
