/* Event Detail Page — Redesigned for conversion + SEO */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, ChevronRight, CheckCircle2, MapPin, Clock, Shield, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage } from "@/components/event-image";
import Lightbox from "./lightbox";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
        acceptedAnswer: { "@type": "Answer", text: `Retreat Arcade provides ${event.title} across Hyderabad, Bangalore, Chennai, Mumbai, Pune, Delhi NCR, Vijayawada and other major Indian cities.` },
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

      <div className="min-h-screen bg-white">

        {/* ── HERO: Full-width image with overlay content ─────────────────────── */}
        {/* ── HERO: Two-column — image left, title+CTA right ───────────────────
             This layout ensures the image is ALWAYS fully visible at any
             resolution or aspect ratio. No cropping, no overflow. ──────── */}
        <div className="bg-charcoal-950 pt-16">
          <div className="max-w-7xl mx-auto px-4 py-6">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-6">
              <Link href="/" className="hover:text-white/80 transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/events" className="hover:text-white/80 transition">Products</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70 truncate max-w-[200px]">{event.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

              {/* Image — always fully visible, any size/ratio */}
              <div className="w-full bg-charcoal-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center" style={{minHeight: '320px'}}>
                <EventImage
                  src={featuredImageUrl}
                  alt={event.title}
                  className="w-full h-auto max-h-[480px] object-contain"
                />
              </div>

              {/* Title + price + CTAs — right side on desktop, below image on mobile */}
              <div className="flex flex-col gap-5">
                {event.category && (
                  <span className="inline-block w-fit text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                )}

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  {event.title}
                </h1>

                {event.summary && (
                  <p className="text-cream-300 text-base leading-relaxed line-clamp-3">
                    {event.summary}
                  </p>
                )}

                {/* Price block */}
                {formattedPrice && (
                  <div className="bg-charcoal-800 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-1">Starting From</p>
                      <p className="text-4xl font-extrabold text-white">₹{formattedPrice}</p>
                      <p className="text-xs text-white/40 mt-1">Final price based on event & duration</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
                      <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      <span className="text-xs text-orange-300 font-medium">Pan India</span>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="tel:+919063679687"
                    className="flex items-center justify-center gap-2 flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-orange-900/30"
                  >
                    <Phone className="h-4 w-4" /> Call to Book
                  </Link>
                  <a
                    href="https://wa.me/917993912762"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-xl transition text-sm"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>

                {/* Mini trust signals */}
                <div className="flex flex-wrap gap-3">
                  {["Free Quote", "Setup Included", "24h Confirmation", "Pan India"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <div key={label} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                  </div>
                ))}
              </div>

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                    Gallery
                  </h2>
                  <Lightbox images={galleryImages} title={event.title} />
                </div>
              )}

              {/* Highlights */}
              {event.highlights?.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                    What's Included
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 leading-snug">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full inline-block" />
                  About This Product
                </h2>
                <div
                  className="
                    prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                    prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-orange-700
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
                    prose-strong:text-gray-900 prose-strong:font-semibold
                    prose-ul:my-3 prose-li:text-gray-700 prose-li:my-1
                    prose-a:text-orange-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                    prose-table:text-sm prose-th:bg-orange-50 prose-th:font-semibold prose-th:p-3 prose-td:p-3 prose-td:border prose-th:border
                  "
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>

              {/* FAQ visible section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
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
                    <details key={i} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 text-sm list-none select-none hover:bg-orange-50 transition-colors">
                        {q}
                        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90 flex-shrink-0 ml-3" />
                      </summary>
                      <p className="px-5 pb-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{a}</p>
                    </details>
                  ))}
                </div>
              </div>

              {/* Similar products */}
              {similarEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gray-300 rounded-full inline-block" />
                    You May Also Like
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {similarEvents.map((ev: any) => (
                      <Link key={ev.id} href={`/events/${ev.slug}`} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-orange-200 transition-all">
                        <div className="h-40 overflow-hidden bg-gray-100">
                          <EventImage
                            src={convertToDirectImageUrl(ev.image_url || "")}
                            alt={ev.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition line-clamp-2 leading-snug">{ev.title}</h3>
                          {ev.price && (
                            <p className="text-sm font-bold text-orange-600 mt-1.5">
                              from ₹{Number(ev.price).toLocaleString("en-IN")}
                            </p>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium mt-2 group-hover:gap-2 transition-all">
                            View details <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT: Sticky booking sidebar */}
            <aside className="lg:sticky lg:top-28 space-y-4">

              {/* Price + CTA card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                {formattedPrice && (
                  <div className="mb-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Starting From</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">₹{formattedPrice}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Final price based on event duration & location</p>
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
                    className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 px-4 rounded-xl transition text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Us
                  </a>
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition text-sm"
                  >
                    Send an Enquiry
                  </Link>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  {[
                    "Response within a few hours",
                    "Free custom quote",
                    "Professional setup included",
                    "Pan India delivery",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service highlights card */}
              {event.highlights?.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">Quick Overview</p>
                  <ul className="space-y-2">
                    {event.highlights.slice(0, 5).map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-orange-500 mt-0.5 flex-shrink-0">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Service links */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Browse Services</p>
                <div className="space-y-1.5">
                  {[
                    { label: "Photo Booth Rentals", href: "/services/photobooth-rentals" },
                    { label: "Interactive Games", href: "/services/interactive-games-rental-hyderabad" },
                    { label: "Team Building", href: "/services/team-building-activities" },
                    { label: "Brand Activation", href: "/services/brand-activation-activities" },
                    { label: "Corporate Events", href: "/services/corporate-events" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="flex items-center justify-between text-xs text-gray-600 hover:text-orange-600 py-1.5 transition group">
                      <span>{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 transition" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Phone strip */}
              <div className="text-center py-3">
                <p className="text-xs text-gray-400 mb-1">Questions? Call us directly</p>
                <a href="tel:+919063679687" className="text-lg font-bold text-orange-600 hover:text-orange-700 transition">
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
