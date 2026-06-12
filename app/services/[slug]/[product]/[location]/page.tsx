import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage, GalleryImage } from "@/components/event-image";
import { buildLocationSchema } from "@/lib/location-schema";
import Lightbox from "@/app/events/[slug]/lightbox";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.retreatarcade.in";

interface Props {
  params: { slug: string; product: string; location: string };
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getService(slug: string) {
  const { data } = await supabase
    .from("services")
    .select("id, title, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

async function getProduct(slug: string) {
  const { data } = await supabase
    .from("events")
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

async function getLocationSeo(serviceId: string, locationId: string) {
  const { data } = await supabase
    .from("service_location_seo")
    .select("meta_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_title, twitter_description, schema_json")
    .eq("service_id", serviceId)
    .eq("location_id", locationId)
    .maybeSingle();
  return data;
}

async function getSimilarProducts(category: string, currentId: string, locationId: string, serviceId: string) {
  // Get other enabled products in the same location+service
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", serviceId)
    .eq("location_id", locationId)
    .eq("is_enabled", true);

  const ids = (assigned || []).map((r: any) => r.product_id).filter((id: string) => id !== currentId);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("events")
    .select("id, title, slug, image_url, summary, price")
    .in("id", ids)
    .eq("status", "published")
    .limit(3);
  return data || [];
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [service, product, location] = await Promise.all([
    getService(params.slug),
    getProduct(params.product),
    getLocation(params.location),
  ]);

  if (!service || !product || !location) {
    return { title: "Not Found | Retreat Arcade" };
  }

  const seo = await getLocationSeo(service.id, location.id);

  const pageUrl = `${siteUrl}/services/${params.slug}/${params.product}/${params.location}`;

  // CMS values take priority; fall back to auto-generated
  const title =
    seo?.meta_title ||
    `${product.title} in ${location.city} | ${service.title} | Retreat Arcade`;

  const description =
    seo?.meta_description ||
    `Book ${product.title} in ${location.city}${location.state ? `, ${location.state}` : ""}. ${product.summary || ""} Available through Retreat Arcade's ${service.title} service.`.trim();

  const ogImage = seo?.og_image || product.image_url || `${siteUrl}/og-image.jpg`;
  const canonical = seo?.canonical_url || pageUrl;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: canonical,
      type: "website",
      siteName: "Retreat Arcade",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.twitter_title || title,
      description: seo?.twitter_description || description,
      images: [ogImage],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductLocationPage({ params }: Props) {
  const [service, product, location] = await Promise.all([
    getService(params.slug),
    getProduct(params.product),
    getLocation(params.location),
  ]);

  if (!service || !product || !location) notFound();

  const seo = await getLocationSeo(service.id, location.id);
  const similarProducts = await getSimilarProducts(product.category, product.id, location.id, service.id);

  const pageUrl = `${siteUrl}/services/${params.slug}/${params.product}/${params.location}`;
  const canonical = seo?.canonical_url || pageUrl;

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

  // Schema: CMS override or auto-built via buildLocationSchema
  const schemaJson =
    seo?.schema_json && Object.keys(seo.schema_json).length > 0
      ? seo.schema_json
      : buildLocationSchema(product, location, {
          seo_title: seo?.meta_title,
          seo_description: seo?.meta_description,
          canonical_url: canonical,
        });

  // BreadcrumbList schema for this deep page
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services` },
      { "@type": "ListItem", position: 3, name: service.title, item: `${siteUrl}/services/${params.slug}` },
      { "@type": "ListItem", position: 4, name: location.city, item: `${siteUrl}/services/${params.slug}/${params.location}` },
      { "@type": "ListItem", position: 5, name: product.title, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-charcoal-950 pt-24">

        {/* Breadcrumb nav */}
        <nav className="max-w-6xl mx-auto px-4 mb-6 text-sm text-cream-400 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-terracotta-400">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-terracotta-400">Services</Link>
          <span>/</span>
          <Link href={`/services/${params.slug}`} className="hover:text-terracotta-400">{service.title}</Link>
          <span>/</span>
          <Link href={`/services/${params.slug}/${params.location}`} className="hover:text-terracotta-400">{location.city}</Link>
          <span>/</span>
          <span className="text-cream-200">{product.title}</span>
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
          {/* Location context pill */}
          <div className="mt-4 inline-flex items-center gap-2 bg-charcoal-800 border border-terracotta-500/20 rounded-full px-4 py-1.5 text-sm text-cream-300">
            <span className="text-terracotta-400">📍</span>
            Available in {location.city}{location.state ? `, ${location.state}` : ""}
            {" · "}
            <Link href={`/services/${params.slug}/${params.location}`} className="text-terracotta-400 hover:underline">
              See all {service.title} in {location.city} →
            </Link>
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
                  <Phone className="mr-3 h-6 w-6" /> Call to Book in {location.city}
                </Link>
              </Button>
              <p className="text-xs text-cream-400 text-center">
                Or{" "}
                <Link href="/contact" className="text-terracotta-400 hover:underline">
                  send us an enquiry
                </Link>
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

            {/* Other products in this city */}
            {similarProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-cream-50 mb-6">
                  More {service.title} in {location.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarProducts.map((p: any) => (
                    <Card key={p.id} className="bg-charcoal-900 border-terracotta-500/20">
                      <EventImage
                        src={convertToDirectImageUrl(p.image_url || "")}
                        alt={p.title}
                        className="w-full h-44 object-cover rounded-t"
                      />
                      <CardContent className="p-4 space-y-2">
                        <h3 className="text-lg font-semibold text-cream-50">{p.title}</h3>
                        <p className="text-sm text-cream-300 line-clamp-2">{p.summary}</p>
                        {p.price && (
                          <p className="text-terracotta-400 font-bold">
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full bg-terracotta-500 text-white">
                          <Link href={`/services/${params.slug}/${p.slug}/${params.location}`}>
                            View in {location.city}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}

          </section>
        </main>
      </div>
    </>
  );
}
