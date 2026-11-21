import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { FitImage } from '@/components/fit-image';
import type { CaseStudy } from '@/lib/case-studies';

const snippet = (story: string | null, max = 150) => {
  const t = String(story || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:\-\s]+$/, '') + '...';
};

/** Real events this product (or city) was used at: photo, what and where, a short piece of the story, and a link to read all of it. */
export function CaseStudyCards({ items, cityNames, heading = 'Seen at these events' }: { items: CaseStudy[]; cityNames: Record<string, string>; heading?: string }) {
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="inline-block h-6 w-1 rounded-full bg-orange-500" />
          {heading}
        </h2>
        <Link href="/our-work" className="text-sm font-semibold text-orange-300 hover:text-orange-200">See all our work</Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((cs) => {
          const city = cs.city_slug ? cityNames[cs.city_slug] || '' : '';
          const when = cs.event_date ? new Date(cs.event_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
          return (
            <li key={cs.slug}>
              <Link href={`/our-work/${cs.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] transition hover:border-orange-400/50">
                {cs.photos[0] && (
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-black/30"><FitImage src={cs.photos[0].url} alt={cs.photos[0].alt} /></span>
                )}
                <span className="flex flex-1 flex-col gap-2 p-4">
                  {cs.event_type && <span className="text-[11px] font-semibold uppercase tracking-widest text-orange-300">{cs.event_type}</span>}
                  <span className="text-sm font-semibold leading-snug text-white transition group-hover:text-orange-300">{cs.title}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
                    {city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{city}{cs.area ? `, ${cs.area}` : ''}</span>}
                    {when && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{when}</span>}
                  </span>
                  {cs.story && <span className="text-sm leading-relaxed text-white/70">{snippet(cs.story)}</span>}
                  <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-semibold text-orange-300 transition-all group-hover:gap-2">Read the full story <ArrowRight className="h-3.5 w-3.5" /></span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
