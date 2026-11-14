import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeaturedServices } from '@/lib/services';
import { TiltCard } from '@/components/three/tilt-card';
import { ZoneChip } from '@/components/world/zone';

export async function ServicesOverview() {
  const services = await getFeaturedServices();
  if (services.length === 0) return null;

  return (
    <section className="relative px-4 py-28 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <ZoneChip className="mb-5">Zone 03 · VR Zone</ZoneChip>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">What We Do</p>
            <h2 className="text-shadow-soft text-4xl font-bold text-white md:text-6xl">Our Services</h2>
          </div>
          <Link
            href="/services"
            data-magnetic="1"
            className="glass inline-flex flex-shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-orange-200 transition hover:text-white"
          >
            All services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <TiltCard key={service.id} max={10} className="h-full rounded-3xl">
              <Link
                href={`/services/${service.slug}`}
                className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-3xl"
              >
                <div className="flex items-center justify-center overflow-hidden bg-black/40" style={{ minHeight: '170px' }}>
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      loading="lazy"
                      className="h-auto max-h-[200px] w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-4xl">🎪</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-display text-base font-bold leading-snug text-white transition group-hover:text-orange-300">
                    {service.title}
                  </h3>
                  {service.summary && (
                    <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-white/70">{service.summary}</p>
                  )}
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-300 transition-all group-hover:gap-2">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
