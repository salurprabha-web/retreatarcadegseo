"use client";

import { useRouter } from "next/navigation";

export default function ProductListClient({
  products,
  locationName,
}: {
  products: any[];
  locationName: string;
}) {
  const router = useRouter();

  const goToMasterProduct = (product: any) => {
    document.title = `${product.title} in ${locationName} | Retreat Arcade`;
    router.push(`/events/${product.slug}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      <h2 className="text-3xl font-bold mb-8">
        Products available in {locationName}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <button
            key={product.slug}
            className="text-left bg-white border rounded-xl p-5 shadow hover:shadow-lg transition"
            onClick={() => goToMasterProduct(product)}
          >
            <h3 className="text-xl font-semibold text-gray-900">
              {product.title} in {locationName}
            </h3>
            <p className="text-gray-600 mt-2 text-sm">
              View full details →
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
