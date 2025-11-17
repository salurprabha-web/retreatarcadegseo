"use client";

import { useRouter } from "next/navigation";

export default function LocationServicePage({ params }: any) {
  const router = useRouter();
  const { slug, location } = params;

  // Fetch the service + products using your existing system
  // (you already have API / supabase calls here in your real file)
  const service = {/* already fetched in your file */};
  const products = service.products || [];

  const goToMasterProduct = (product: any) => {
    // 1. Change meta title dynamically
    document.title = `${product.title} in ${location} | Retreat Arcade`;

    // 2. Redirect to master product page (no location)
    router.push(`/services/${product.slug}`);
  };

  return (
    <div>
      <h1>{service.title} in {location}</h1>

      <h2 className="text-2xl font-bold my-6">Products available in {location}</h2>

      <div className="grid gap-6">
        {products.map((product: any) => (
          <button
            key={product.slug}
            onClick={() => goToMasterProduct(product)}
            className="p-6 border rounded-xl shadow hover:bg-gray-50 text-left"
          >
            <div className="text-xl font-semibold">
              {product.title} in {location}
            </div>
            <div className="text-gray-600 text-sm">
              Click to see full details →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
