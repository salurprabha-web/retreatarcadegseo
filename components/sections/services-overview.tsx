import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeaturedServices } from '@/lib/services';

export async function ServicesOverview() {
  const services = await getFeaturedServices();
  if (services.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-2">What We Do</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Our Services</h2>
          </div>
          <Link href="/services"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition">
            All services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid — 4 cols on large, 2 on medium, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="bg-[#07091a] flex items-center justify-center overflow-hidden" style={{ minHeight: '160px' }}>
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.title}
                    loading="lazy"
                    className="w-full h-auto max-h-[190px] object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <span className="text-4xl">🎪</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition leading-snug">
                  {service.title}
                </h3>
                {service.summary && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {service.summary}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 group-hover:gap-2 transition-all mt-1">
                  Learn more <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
