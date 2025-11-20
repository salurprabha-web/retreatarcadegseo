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
    return <div className="text-gray-500 p-6">No products available.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {products.map((p) => (
        <a
          key={p.id}
          href={`/events/${p.slug}`}
          className="border rounded-xl overflow-hidden shadow hover:shadow-lg transition"
        >
          <img
            src={p.image_url || "/placeholder.jpg"}
            alt={p.title}
            className="w-full h-48 object-cover"
          />

          <div className="p-4">
            <h3 className="text-lg font-semibold">{p.title}</h3>

            <p className="text-terracotta-500 font-bold text-xl mt-2">
              ₹{p.price?.toLocaleString() || "—"}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Available in {locationName}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
