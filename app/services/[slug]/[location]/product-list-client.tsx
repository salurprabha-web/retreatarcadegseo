"use client";

interface Product {
  id: string;
  title: string;
  slug: string;
  price?: number;
  image_url?: string;
}

interface Props {
  products: Product[];
  locationName: string;
}

export default function ProductList({ products, locationName }: Props) {
  if (!products || products.length === 0)
    return (
      <div className="text-gray-500 p-6 text-center text-lg">
        No products available in {locationName}.
      </div>
    );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
      {products.map((p) => (
        <a
          key={p.id}
          href={`/events/${p.slug}`}
          className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-gray-200 hover:border-terracotta-400"
        >
          {/* IMAGE */}
          <div className="relative h-56 overflow-hidden">
            <img
              src={p.image_url || "/placeholder.jpg"}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            <span className="absolute top-3 right-3 bg-terracotta-500 text-white text-xs px-3 py-1 rounded-full shadow">
              {locationName}
            </span>
          </div>

          {/* CONTENT */}
          <div className="p-5">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-terracotta-600 transition">
              {p.title}
            </h3>

            <p className="mt-3 text-terracotta-600 font-bold text-lg">
              ₹{p.price?.toLocaleString("en-IN") || "Price on Request"}
            </p>

            <p className="text-gray-500 text-sm mt-1">
              Available in {locationName}
            </p>

            <button className="mt-6 w-full bg-terracotta-500 hover:bg-terracotta-600 text-white py-2.5 rounded-xl shadow-md transition font-medium">
              View Details →
            </button>
          </div>
        </a>
      ))}
    </div>
  );
}
