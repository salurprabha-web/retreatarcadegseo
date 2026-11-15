/* Event Detail Page — Redesigned for conversion + SEO */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, ChevronRight, CheckCircle2, MapPin, Clock, Shield, Star, Box } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage } from "@/components/event-image";
import { ProductStage } from "@/components/three/product-stage";
import { TiltCard } from "@/components/three/tilt-card";
import { ZoneChip } from "@/components/world/zone";
import Lightbox from "./lightbox";
import { ViewTracker } from "@/components/view-tracker";

export const revalidate = 300;

// Detail pages are rendered on the first visit, then served from cache and refreshed in the background.
export function generateStaticParams() {
  return [];
}
type Props = { params: { slug: string } };

const domain = "https://www.retreatarcade.in";

async function getEvent(slug: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

async function getSimilarEvents(category: string, currentId: string) {
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, image_url, summary, price")
    .eq("category", category)
    .neq("id", currentId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);
  return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: "Event Not Found | Retreat Arcade" };
  const title = event.meta_title || event.title;
  const description = event.meta_description || event.summary || "";
  const keywords = event.meta_keywords?.length ? event.meta_keywords.join(",") : "";
  const image = event.image_url || undefined;
  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;
  return {
    title, description, keywords,
    alternates: { canonical },
    openGraph: { title, description, images: image ? [image] : undefined, url: canonical },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const similarEvents = await getSimilarEvents(event.category, event.id);

  const featuredImageUrl = event.image_url
    ? convertToDirectImageUrl(event.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(event.gallery_images)) galleryImages = event.gallery_images;
    else if (typeof event.gallery_images === "string") galleryImages = JSON.parse(event.gallery_images);
  } catch {}
  galleryImages = galleryImages.map((u) => convertToDirectImageUrl(u)).filter(Boolean);

  const canonical = event.canonical_url || `${domain}/events/${event.slug}`;

  // ── Schema: Service + BreadcrumbList + FAQPage ──────────────────────────────
  const serviceSchema = event.schema_json && Object.keys(event.schema_json).length > 0
    ? event.schema_json
    : {
        "@context": "https://schema.org", "@type": "Service",
        name: event.title, description: event.summary || "",
        image: event.image_url ? [event.image_url] : undefined,
        url: canonical,
        areaServed: { "@type": "Country", name: "India" },
        provider: { "@type": "LocalBusiness", name: "Retreat Arcade", url: domain },
        offers: event.price ? { "@type": "Offer", price: String(event.price), priceCurrency: "INR", availability: "https://schema.org/InStock" } : undefined,
      };

  const breadcrumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: domain },
      { "@type": "ListItem", position: 2, name: "Products", item: `${domain}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: canonical },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How much does ${event.title} cost in Hyderabad?`,
        acceptedAnswer: { "@type": "Answer", text: event.price ? `${event.title} rental starts from ₹${Number(event.price).toLocaleString("en-IN")} in Hyderabad. Contact Retreat Arcade on +91 9063679687 for a free custom quote.` : `Contact Retreat Arcade for a personalised quote for ${event.title}.` },
      },
      {
        "@type": "Question",
        name: `Where in India does Retreat Arcade provide ${event.title}?`,
        acceptedAnswer: { "@type": "Answer", text: `Retreat Arcade provides ${event.title} across Hyderabad, Visakhapatnam (Vizag), Bangalore, Chennai, Mumbai, Pune, Delhi NCR, Vijayawada and other major Indian cities.` },
      },
      {
        "@type": "Question",
        name: `How do I book ${event.title}?`,
        acceptedAnswer: { "@type": "Answer", text: "Call or WhatsApp +91 9063679687, or fill the contact form at retreatarcade.in/contact. We confirm bookings within 24 hours." },
      },
    ],
  };

  const formattedPrice = event.price ? Number(event.price).toLocaleString("en-IN") : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {/* ✅ Silently increments view_count on every product page visit */}
      <ViewTracker eventId={event.id} />

      <div className="min-h-screen">

        {/* ── HERO: Full-width image with overlay content ─────────────────────── */}
        {/* ── HERO: Two-column — image left, title+CTA right ───────────────────
             This layout ensures the image is ALWAYS fully visible at any
             resolution or aspect ratio. No cropping, no overflow. ──────── */}
        {/* ── SHOWROOM HERO ─────────────────────────────────────────────────────
             Headline + booking actions on the left, big draggable 3D viewer on the
             right. All text/links are real HTML (SEO), unchanged in content. */}
        <section className="relative px-4 pb-10 pt-32 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-white/70">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/events" className="hover:text-white transition">Products</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[240px] truncate text-white">{event.title}</span>
            </nav>

            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
              <div className="order-2 flex flex-col gap-5 lg:order-1">
                <ZoneChip className="w-fit">Showroom{event.category ? ` · ${event.category}` : ''}</ZoneChip>

                <h1 className="text-shadow-soft text-4xl font-bold leading-[1.04] text-white sm:text-5xl lg:text-6xl">
                  {event.title}
                </h1>

                {event.summary && (
                  <p className="text-shadow-soft text-lg leading-relaxed text-white/85">{event.summary}</p>
                )}

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
                    <Phone className="h-4 w-4" /> Call to Book
                  </Link>
                  <a
                    href="https://wa.me/917993912762"
                    target="_blank" rel="noopener noreferrer"
                    data-magnetic="1"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0F7A40] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#0b6634]"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <Link
                    href={`/plan-your-event?add=${event.id}`}
                    rel="nofollow"
                    data-magnetic="1"
                    className="glass flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-orange-200 transition hover:text-white"
                  >
                    <Box className="h-4 w-4" /> Place it in your 3D venue
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["Free Quote", "Setup Included", "24h Confirmation", "Pan India"].map((t) => (
                    <span key={t} className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white/80">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3D product viewer — drag to rotate; real <img> stays in DOM for SEO */}
              <div className="order-1 lg:order-2">
                <ProductStage src={featuredImageUrl} alt={event.title} />
              </div>
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT GRID ────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">

            {/* LEFT: Main content */}
            <div className="space-y-8">

              {/* Trust strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Shield, label: "Professional Setup" },
                  { icon: Clock, label: "Quick Installation" },
                  { icon: Star, label: "5★ Rated Service" },
                  { icon: MapPin, label: "Pan India Delivery" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5">
                    <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-white/75">{label}</span>
                  </div>
                ))}
              </div>

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                    Gallery
                  </h2>
                  <Lightbox images={galleryImages} title={event.title} />
                </div>
              )}

              {/* Highlights */}
              {event.highlights?.length > 0 && (
                <div className="bg-white/[0.04] rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                    What's Included
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-white/[0.05] rounded-xl p-3.5 border border-white/10 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/75 leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="glass rounded-3xl p-6 md:p-10">
                <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                  About This Product
                </h2>
                <div
                  className="
                    prose prose-lg prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-white
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10
                    prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-orange-300
                    prose-p:text-white/75 prose-p:leading-relaxed prose-p:mb-3
                    prose-strong:text-white prose-strong:font-semibold
                    prose-ul:my-3 prose-li:text-white/75 prose-li:my-1
                    prose-a:text-orange-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                    prose-table:text-sm prose-th:bg-white/10 prose-th:font-semibold prose-th:p-3 prose-td:p-3 prose-td:border prose-th:border
                  "
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>

              {/* FAQ visible section */}
              <div className="bg-white/[0.04] rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {[
                    {
                      q: `How much does ${event.title} cost in Hyderabad?`,
                      a: formattedPrice
                        ? `Rental starts from ₹${formattedPrice}. Final pricing depends on event duration, location, and customisations. Contact us for a free quote.`
                        : `Pricing depends on event type, duration, and location. Contact us for a personalised quote.`,
                    },
                    {
                      q: `Which cities do you cover?`,
                      a: `We cover Hyderabad, Bangalore, Chennai, Mumbai, Pune, Delhi NCR, Vijayawada, Vizag and other major cities across India.`,
                    },
                    {
                      q: `How do I book?`,
                      a: `Call or WhatsApp +91 9063679687 or fill our contact form. We confirm within 24 hours.`,
                    },
                  ].map(({ q, a }, i) => (
                    <details key={i} className="group bg-white/[0.05] border border-white/15 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-white text-sm list-none select-none hover:bg-white/5 transition-colors">
                        {q}
                        <ChevronRight className="h-4 w-4 text-white/65 transition-transform group-open:rotate-90 flex-shrink-0 ml-3" />
                      </summary>
                      <p className="px-5 pb-4 pt-0 text-sm text-white/65 leading-relaxed border-t border-white/10">{a}</p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Similar products */}
              {similarEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gray-300 rounded-full inline-block" />
                    You May Also Like
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {similarEvents.map((ev: any) => (
                      <TiltCard key={ev.id} max={9} className="h-full rounded-2xl"><Link href={`/events/${ev.slug}`} className="group bg-white/[0.05] border border-white/10 rounded-2xl overflow-hidden hover:shadow-md hover:border-orange-400/50 h-full block transition-all">
                        <div className="h-40 overflow-hidden bg-white/[0.06]">
                          <EventImage
                            src={convertToDirectImageUrl(ev.image_url || "")}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-semibold text-white group-hover:text-orange-400 transition line-clamp-2 leading-snug">{ev.title}</h3>
                          {ev.price && (
                            <p className="text-sm font-bold text-orange-400 mt-1.5">
                              from ₹{Number(ev.price).toLocaleString("en-IN")}
                            </p>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium mt-2 group-hover:gap-2 transition-all">
                            View details <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                      </TiltCard>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT: Sticky booking sidebar */}
            <aside className="lg:sticky lg:top-28 space-y-4">

              {/* Price + CTA card */}
              <div className="bg-white/[0.05] border border-white/15 rounded-2xl p-6 shadow-sm">
                {formattedPrice && (
                  <div className="mb-5">
                    <p className="text-xs text-white/55 uppercase tracking-wide font-semibold mb-1">Starting From</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">₹{formattedPrice}</span>
                    </div>
                    <p className="text-xs text-white/65 mt-1">Final price based on event duration & location</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Link
                    href="tel:+919063679687"
                    className="flex items-center justify-center gap-2.5 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition text-sm shadow-md shadow-orange-200"
                  >
                    <Phone className="h-4 w-4" />
                    Call to Book Now
                  </Link>
                  <a
                    href="https://wa.me/917993912762"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[#0F7A40] hover:bg-[#0b6634] text-white font-bold py-3.5 px-4 rounded-xl transition text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Us
                  </a>
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 w-full border border-white/15 hover:border-orange-300 hover:bg-white/5 text-white/75 font-medium py-3 px-4 rounded-xl transition text-sm"
                  >
                    Send an Enquiry
                  </Link>
                </div>

                <div className="mt-5 pt-5 border-t border-white/10 space-y-2.5">
                  {[
                    "Response within a few hours",
                    "Free custom quote",
                    "Professional setup included",
                    "Pan India delivery",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-white/65">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service highlights card */}
              {event.highlights?.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-5">
                  <p className="text-xs font-bold text-orange-300 uppercase tracking-wide mb-3">Quick Overview</p>
                  <ul className="space-y-2">
                    {event.highlights.slice(0, 5).map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/75">
                        <span className="text-orange-500 mt-0.5 flex-shrink-0">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Service links */}
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-white/55 uppercase tracking-wide mb-3">Browse Services</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Photo Booth Rentals", href: "/services/photobooth-rentals" },
                    { label: "Interactive Games", href: "/services/interactive-games-rental" },
                    { label: "Team Building", href: "/services/team-building-activities" },
                    { label: "Brand Activation", href: "/services/brand-activation-activities" },
                    { label: "Corporate Events", href: "/services/corporate-entertainment-solutions" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="flex items-center justify-between text-xs text-white/65 hover:text-orange-400 py-1.5 transition group">
                      <span>{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-white/55 group-hover:text-orange-400 transition" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Phone strip */}
              <div className="text-center py-3">
                <p className="text-xs text-white/65 mb-1">Questions? Call us directly</p>
                <a href="tel:+919063679687" className="text-lg font-bold text-orange-400 hover:text-orange-300 transition">
                  +91 9063679687
                </a>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
