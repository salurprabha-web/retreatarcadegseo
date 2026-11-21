"use client";

import { FitImage } from '@/components/fit-image';
import { TiltCard } from "@/components/three/tilt-card";

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
  locationSlug: string;
  serviceSlug: string;
}

export default function ProductList({ products, locationName, locationSlug, serviceSlug }: Props) {
  if (!products || products.length === 0)
    return (
      <div className="p-6 text-center text-lg text-white/60">
        No products available in {locationName}.
      </div>
    );

  return (
    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <TiltCard key={p.id} max={9} className="h-full rounded-2xl">
          <a
            // Links to the location-specific product page, not the national product page
            href={`/services/${serviceSlug}/${locationSlug}/${p.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] transition-colors hover:border-orange-400/50"
          >
            <div className="relative h-56 overflow-hidden bg-black/40">
              <FitImage src={p.image_url || "/placeholder.jpg"} alt={`${p.title} in ${locationName}`} />
              <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs text-white shadow">
                {locationName}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-xl font-semibold text-white transition group-hover:text-orange-300">
                {p.title} in {locationName}
              </h3>
              <p className="mt-3 text-lg font-bold text-orange-300">
                {p.price ? `₹${p.price.toLocaleString("en-IN")}` : "Price on Request"}
              </p>
              <span className="mt-auto block rounded-xl bg-orange-500 py-2.5 text-center font-medium text-white shadow-md transition group-hover:bg-orange-600">
                View Details →
              </span>
            </div>
          </a>
        </TiltCard>
      ))}
    </div>
  );
}
