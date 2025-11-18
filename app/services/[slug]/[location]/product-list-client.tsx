"use client";

import { useRouter } from "next/navigation";

interface ProductListClientProps {
  products: {
    id: string;
    title: string;
    slug: string;
    price?: number;
    image_url?: string;
  }[];
  locationName?: string; // <-- made optional to avoid TS build errors
}

export default function ProductListClient({
  products,
  locationName = "",
}: ProductListClientProps) {
  const router = useRouter();

  const goToMasterProduct = (product: any) => {
    if (locationName) {
      document.title = `${product.title} in ${locationName} | Retreat Arcade`;
    }
    router.push(`/services/${product.slug}`);
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      {locationName && (
        <h2 className="text-3xl font-bold mb-8">
          Products available in {locationName}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <button
            key={product.slug}
            className="text-left bg-white border rounded-xl p-5 shadow hover:shadow-lg transition"
            onClick={() => goToMasterProduct(product)}
          >
            <h3 className="text-xl font-semibold text-gray-900">
              {product.title}
              {locationName ? ` in ${locationName}` : ""}
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
