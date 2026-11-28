import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, MapPin, CalendarDays, Users, Quote, ArrowRight } from 'lucide-react';
import { ZoneHero, Panel } from '@/components/world/zone';
import { BlogLeadForm } from '@/components/blog-lead-form';
import { CaseGallery } from '@/components/case-gallery';
import { getCaseStudy, getPublishedCaseStudies } from '@/lib/case-studies';
import { getCityProductLinks } from '@/lib/link-graph';
import { supabase } from '@/lib/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCaseStudy(params.slug);
  if (!c) return { title: 'Not Found | Retreat Arcade' };
  const title = c.meta_title || `${c.title} | Retreat Arcade`;
  const description = c.meta_description || (c.story || '').slice(0, 155);
  const url = `${siteUrl}/our-work/${c.slug}`;
  const image = c.photos[0]?.url;
  return {
    title, description,
    ...(c.focus_keyword ? { keywords: [c.focus_keyword] } : {}),
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', siteName: 'Retreat Arcade', images: image ? [{ url: image, width: 1200, height: 630, alt: c.photos[0].alt }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  const c = await getCaseStudy(params.slug);
  if (!c) notFound();

  const [{ data: cityRow }, { data: prodRows }, more] = await Promise.all([
    c.city_slug ? supabase.from('locations').select('city, slug').eq('slug', c.city_slug).maybeSingle() : Promise.resolve({ data: null as any }),
    c.product_slugs.length ? supabase.from('events').select('title, slug').in('slug', c.product_slugs).eq('status', 'published') : Promise.resolve({ data: [] as any[] }),
    getPublishedCaseStudies({ citySlug: c.city_slug || undefined, limit: 4, excludeSlug: c.slug }),
  ]);
  const cityName: string | undefined = (cityRow as any)?.city;
  // link each product to its main page in this city when it has one, otherwise to the general product page
  const cityLinks = cityName && c.city_slug ? await getCityProductLinks(c.city_slug, cityName) : [];
  const products = ((prodRows as any[]) || []).map((p) => {
    const hit = cityLinks.find((l) => l.name.trim().toLowerCase() === String(p.title).trim().toLowerCase());
    return { title: String(p.title).trim(), href: hit?.url || `/events/${p.slug}` };
  });

  const url = `${siteUrl}/our-work/${c.slug}`;
  const paragraphs = String(c.story || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const [cover, ...rest] = c.photos;
  // with a longer story and plenty of photos, one photo sits inside the story after each of the first two paragraphs; the rest go to the gallery
  const inline = paragraphs.length >= 3 && rest.length > 3 ? rest.slice(0, 2) : [];
  const gallery = rest.slice(inline.length);
  const dateText = c.event_date ? new Date(c.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: c.title, description: c.meta_description || undefined, url,
      image: c.photos.map((p) => p.url), datePublished: c.published_at || c.event_date || undefined, dateModified: c.updated_at || c.published_at || undefined,
      author: { '@type': 'Organization', name: 'Retreat Arcade' }, publisher: { '@type': 'Organization', name: 'Retreat Arcade', url: siteUrl },
      mainEntityOfPage: url, ...(cityName ? { about: { '@type': 'City', name: cityName } } : {}),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Our work', item: `${siteUrl}/our-work` },
        { '@type': 'ListItem', position: 3, name: c.title, item: url },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />)}
      <ZoneHero
        crumbs={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/our-work" className="hover:text-white transition">Our work</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="max-w-[220px] truncate text-white">{c.title}</span>
          </nav>
        }
        chip={[c.event_type, cityName].filter(Boolean).join(' · ') || 'Real event'}
        title={c.title}
        description={c.meta_description || undefined}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
          {cityName && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{cityName}{c.area ? `, ${c.area}` : ''}</span>}
          {dateText && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{dateText}</span>}
          {c.guests && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{c.guests} guests</span>}
        </div>
      </ZoneHero>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pb-24 sm:px-6 lg:px-8">
        {cover && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.url} alt={cover.alt} width={1200} height={800} className="h-auto w-full rounded-3xl" />
            {cover.caption && <figcaption className="mt-2 text-center text-sm text-white/60">{cover.caption}</figcaption>}
          </figure>
        )}

        <Panel className="p-7 sm:p-10">
          <div className="space-y-4 text-lg leading-relaxed text-white/80">
            {paragraphs.map((p, i) => (
              <div key={i} className="space-y-4">
                <p>{p}</p>
                {inline[i] && (
                  <figure className="py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inline[i].url} alt={inline[i].alt} loading="lazy" className="h-auto w-full rounded-2xl" />
                    {inline[i].caption && <figcaption className="mt-2 text-sm text-white/60">{inline[i].caption}</figcaption>}
                  </figure>
                )}
              </div>
            ))}
          </div>
          {products.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-300">What we set up</h2>
              <ul className="flex flex-wrap gap-2">
                {products.map((p) => (
                  <li key={p.href}><Link href={p.href} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/90 transition hover:border-orange-400/60 hover:text-orange-200">{p.title}<ArrowRight className="h-3.5 w-3.5" /></Link></li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <CaseGallery photos={gallery} />

        {c.quote_text && (
          <Panel className="p-7 sm:p-10">
            <Quote className="mb-3 h-7 w-7 text-orange-400" />
            <blockquote className="text-xl leading-relaxed text-white">&ldquo;{c.quote_text}&rdquo;</blockquote>
            {(c.quote_name || c.quote_role || c.client_name) && (
              <p className="mt-4 text-sm text-white/65">{[c.quote_name, c.quote_role, c.client_name].filter(Boolean).join(', ')}</p>
            )}
          </Panel>
        )}

        <BlogLeadForm slug={c.slug} source={`/our-work/${c.slug}`} cityName={cityName} citySlug={c.city_slug || undefined} />

        {(c.city_slug && cityName) || more.length > 0 ? (
          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">More from {cityName || 'our work'}</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {c.city_slug && cityName && (
                <li><Link href={`/locations/${c.city_slug}`} className="glass flex items-center justify-between rounded-2xl px-5 py-4 text-white transition hover:text-orange-200"><span className="font-semibold">Event entertainment in {cityName}</span><ArrowRight className="h-4 w-4 text-orange-300" /></Link></li>
              )}
              {more.map((m) => (
                <li key={m.slug}><Link href={`/our-work/${m.slug}`} className="glass flex items-center justify-between rounded-2xl px-5 py-4 text-white transition hover:text-orange-200"><span className="font-semibold">{m.title}</span><ArrowRight className="h-4 w-4 text-orange-300" /></Link></li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
