import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage } from "@/components/event-image";
import Lightbox from "@/app/events/[slug]/lightbox";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.retreatarcade.in";

interface Props {
  params: { slug: string; location: string };
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getProduct(slug: string) {
  const { data } = await supabase
    .from("events")                   // ← correct: events table, not services
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

async function getLocation(slug: string) {
  const { data } = await supabase
    .from("locations")
    .select("id, city, slug, state")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

// Find which service this product belongs to (for breadcrumbs + related links)
async function getParentService(productId: string, locationId: string) {
  const { data } = await supabase
    .from("service_location_products")
    .select("service_id, services!fk_service(id, title, slug)")
    .eq("product_id", productId)
    .eq("location_id", locationId)
    .eq("is_enabled", true)
    .limit(1)
    .maybeSingle();
  return (data as any)?.services || null;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [product, location] = await Promise.all([
    getProduct(params.slug),
    getLocation(params.location),
  ]);

  if (!product || !location) return { title: "Not Found | Retreat Arcade" };

  const pageUrl = `${siteUrl}/events/${params.slug}/${params.location}`;

  // events table has its own CMS meta fields (meta_title, meta_description, canonical_url)
  // For location-specific override we use the product's own meta as base
  const title =
    product.meta_title
      ? `${product.meta_title} in ${location.city}`
      : `${product.title} in ${location.city} | Retreat Arcade`;

  const description =
    product.meta_description ||
    product.summary ||
    `Book ${product.title} in ${location.city}${location.state ? `, ${location.state}` : ""}. Available through Retreat Arcade.`;

  const ogImage = product.image_url || `${siteUrl}/og-image.jpg`;
  // Canonical points to the service-based URL if the product is linked to a service+location
  // Otherwise points to this URL
  const canonical = `${siteUrl}/events/${params.slug}/${params.location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Retreat Arcade",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductLocationPage({ params }: Props) {
  const [product, location] = await Promise.all([
    getProduct(params.slug),
    getLocation(params.location),
  ]);

  if (!product || !location) notFound();

  const parentService = await getParentService(product.id, location.id);

  const featuredImageUrl = product.image_url
    ? convertToDirectImageUrl(product.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(product.gallery_images)) galleryImages = product.gallery_images;
    else if (typeof product.gallery_images === "string")
      galleryImages = JSON.parse(product.gallery_images);
  } catch {}
  galleryImages = galleryImages.map((url: string) => convertToDirectImageUrl(url)).filter(Boolean);

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": product.price ? "Product" : "Service",
    name: `${product.title} in ${location.city}`,
    description: product.summary || product.description,
    image: product.image_url ? [product.image_url] : undefined,
    url: `${siteUrl}/events/${params.slug}/${params.location}`,
    areaServed: { "@type": "City", name: location.city },
    offers: product.price
      ? {
          "@type": "Offer",
          price: String(product.price),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    provider: {
      "@type": "LocalBusiness",
      name: "Retreat Arcade",
      url: siteUrl,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Products", item: `${siteUrl}/events` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${siteUrl}/events/${params.slug}` },
      { "@type": "ListItem", position: 4, name: `In ${location.city}`, item: `${siteUrl}/events/${params.slug}/${params.location}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-charcoal-950 pt-24">

        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 mb-6 text-sm text-cream-400 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-terracotta-400">Home</Link>
          <span>/</span>
          <Link href="/events" className="hover:text-terracotta-400">Products</Link>
          <span>/</span>
          <Link href={`/events/${params.slug}`} className="hover:text-terracotta-400">{product.title}</Link>
          <span>/</span>
          <span className="text-cream-200">{location.city}</span>
        </nav>

        {/* Main image */}
        <section className="w-full max-w-6xl mx-auto px-4 mb-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <EventImage
              src={featuredImageUrl}
              alt={`${product.title} in ${location.city}`}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
          </div>
        </section>

        {/* Title */}
        <div className="max-w-5xl mx-auto px-4 mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-cream-50 leading-tight">
            {product.title} in {location.city}
          </h1>
          {product.summary && (
            <p className="mt-6 text-lg md:text-xl text-cream-300 max-w-4xl mx-auto leading-relaxed">
              {product.summary}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-charcoal-800 border border-terracotta-500/20 rounded-full px-4 py-1.5 text-cream-300">
              <span className="text-terracotta-400">📍</span>
              {location.city}{location.state ? `, ${location.state}` : ""}
            </span>
            {/* If this product is part of a service, show the link back */}
            {parentService && (
              <Link
                href={`/services/${parentService.slug}/${params.location}`}
                className="inline-flex items-center gap-1.5 bg-charcoal-800 border border-terracotta-500/20 rounded-full px-4 py-1.5 text-terracotta-400 hover:underline"
              >
                See all {parentService.title} in {location.city} →
              </Link>
            )}
          </div>
        </div>

        {/* Main grid */}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">

          {/* Sidebar */}
          <aside className="order-1 lg:order-2">
            <Card className="bg-charcoal-900 border-terracotta-500/20 sticky top-32 p-6 space-y-6 rounded-2xl shadow-xl">
              {product.price && (
                <div className="bg-charcoal-800 p-5 rounded-xl border border-terracotta-500/20 flex items-center">
                  <span className="text-gold-400 text-2xl font-bold mr-3">₹</span>
                  <div>
                    <p className="text-sm text-cream-400">Starting From</p>
                    <p className="text-cream-50 text-2xl font-bold">
                      {Number(product.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}
              <Button asChild size="lg" className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white py-5 text-lg rounded-xl">
                <Link href="tel:+919063679687">
                  <Phone className="mr-3 h-6 w-6" /> Book in {location.city}
                </Link>
              </Button>
              <p className="text-xs text-cream-400 text-center">
                Or{" "}
                <Link href="/contact" className="text-terracotta-400 hover:underline">send an enquiry</Link>
              </p>
            </Card>
          </aside>

          {/* Content */}
          <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">

            {galleryImages.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-cream-50 mb-5">Gallery</h2>
                <Lightbox images={galleryImages} title={`${product.title} in ${location.city}`} />
              </section>
            )}

            {product.highlights?.length > 0 && (
              <Card className="bg-charcoal-900 border border-terracotta-500/20 rounded-2xl shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-cream-50 mb-6">Key Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.highlights.map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-charcoal-800 rounded-lg p-4">
                        <span className="text-gold-400 text-lg">✓</span>
                        <span className="text-cream-300">{h}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-charcoal-900 border border-terracotta-500/20 rounded-2xl shadow-xl">
              <CardContent className="p-8 md:p-10">
                <h2 className="text-3xl font-bold text-cream-50 mb-8 border-b border-terracotta-500/20 pb-4">
                  Product Details
                </h2>
                <div className="event-description" dangerouslySetInnerHTML={{ __html: product.description }} />
              </CardContent>
            </Card>

          </section>
        </main>
      </div>
    </>
  );
}
