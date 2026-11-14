import Link from 'next/link';
import { Phone, MessageCircle, Box, CheckCircle2, MapPin } from 'lucide-react';
import { ProductStage } from '@/components/three/product-stage';
import { ZoneChip } from './zone';

/**
 * Shared "showroom" hero for product pages: headline, price and booking actions
 * on the left, a large draggable 3D viewer on the right. Content props are the
 * same text the pages already rendered (title, summary, price, links).
 */
export function ShowroomHero({
  crumbs,
  chip,
  title,
  summary,
  price,
  image,
  imageAlt,
  productId,
  bookLabel = 'Call to Book',
  meta,
}: {
  crumbs: React.ReactNode;
  chip: string;
  title: React.ReactNode;
  summary?: string | null;
  price?: number | string | null;
  image: string;
  imageAlt: string;
  productId?: string;
  bookLabel?: string;
  meta?: React.ReactNode;
}) {
  const formattedPrice = price ? Number(price).toLocaleString('en-IN') : null;
  return (
    <section className="relative px-4 pb-10 pt-32 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-white/70">
          {crumbs}
        </nav>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <ZoneChip className="w-fit">{chip}</ZoneChip>
            <h1 className="text-shadow-soft text-4xl font-bold leading-[1.04] text-white sm:text-5xl lg:text-6xl">{title}</h1>
            {summary && <p className="text-shadow-soft text-lg leading-relaxed text-white/85">{summary}</p>}
            {meta && <div className="flex flex-wrap gap-3 text-sm">{meta}</div>}

            {formattedPrice && (
              <div className="glass flex items-center gap-4 rounded-3xl px-6 py-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">Starting From</p>
                  <p className="font-display text-4xl font-bold text-white">₹{formattedPrice}</p>
                  <p className="mt-1 text-xs text-white/60">Final price based on event & duration</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
                  <span className="text-xs font-medium text-orange-300">Pan India</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="tel:+919063679687"
                data-magnetic="1"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_40px_-8px_rgba(194,65,12,0.8)] transition hover:bg-orange-600"
              >
                <Phone className="h-4 w-4" /> {bookLabel}
              </Link>
              <a
                href="https://wa.me/917993912762"
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic="1"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#128C4A] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0f7a40]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <Link
                href={productId ? `/plan-your-event?add=${productId}` : '/plan-your-event'}
                data-magnetic="1"
                className="glass flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-orange-200 transition hover:text-white"
              >
                <Box className="h-4 w-4" /> Place it in your 3D venue
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Free Quote', 'Setup Included', '24h Confirmation', 'Pan India'].map((t) => (
                <span key={t} className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/80">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <ProductStage src={image} alt={imageAlt} />
          </div>
        </div>
      </div>
    </section>
  );
}
