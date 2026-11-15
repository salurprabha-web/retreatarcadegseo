import type { Metadata } from "next";
import { ShowroomHero } from "@/components/world/showroom-hero";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { convertToDirectImageUrl } from "@/lib/image-utils";
import { EventImage } from "@/components/event-image";
import { buildLocationSchema } from "@/lib/location-schema";
import { getPrimaryServiceSlug } from "@/lib/primary-service";
import Lightbox from "@/app/events/[slug]/lightbox";
import { ProductStage } from "@/components/three/product-stage";
import { TiltCard } from "@/components/three/tilt-card";

export const revalidate = 300;

// Detail pages are rendered on the first visit, then served from cache and refreshed in the background.
export function generateStaticParams() {
  return [];
}
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.retreatarcade.in";

interface Props {
  params: { slug: string; location: string; product: string };
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

async function getProductPage(serviceId: string, locationId: string, productId: string) {
  const { data } = await supabase
    .from("product_location_pages")
    .select("*")
    .eq("service_id", serviceId)
    .eq("location_id", locationId)
    .eq("product_id", productId)
    .maybeSingle();
  return data;
}

async function getSiblingProducts(serviceId: string, locationId: string, currentProductId: string) {
  const { data: assigned } = await supabase
    .from("service_location_products")
    .select("product_id")
    .eq("service_id", serviceId)
    .eq("location_id", locationId)
    .eq("is_enabled", true);

  const { data: hiddenRows } = await supabase
    .from("product_location_pages")
    .select("product_id")
    .eq("service_id", serviceId)
    .eq("location_id", locationId)
    .eq("status", "draft");
  const hidden = new Set((hiddenRows || []).map((r: any) => r.product_id));
  const ids = (assigned || [])
    .map((r: any) => r.product_id)
    .filter((id: string) => id !== currentProductId && !hidden.has(id));

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
  const gen = await getProductPage(service.id, location.id, product.id);
  if (gen?.status === "draft") {
    return { title: "Not Found | Retreat Arcade", robots: { index: false, follow: false } };
  }
  const genLive = gen?.status === "published" ? gen : null;

  const pageUrl = `${siteUrl}/services/${params.slug}/${params.location}/${params.product}`;
  // Pages with their own approved text: the primary service's page is the one Google should rank; the same product
  // under other services points to it. Pages without generated text keep the old behaviour.
  const primarySlug = genLive ? await getPrimaryServiceSlug(product.id, location.id) : null;
  const canonical = genLive ? `${siteUrl}/services/${primarySlug || params.slug}/${params.location}/${params.product}` : seo?.canonical_url || pageUrl;

  // The CMS row (service_location_seo) belongs to the service+city, so every product in that city
  // would share one title and description. Product pages get their own instead.
  const title = genLive?.meta_title || `${product.title} in ${location.city} | Retreat Arcade`;

  const description = genLive?.meta_description ||
    `Book ${product.title} in ${location.city}${location.state ? `, ${location.state}` : ""}. ${product.summary || ""} Available through Retreat Arcade's ${service.title} service.`.trim();

  const ogImage = seo?.og_image || product.image_url || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    ...(genLive?.focus_keyword ? { keywords: [genLive.focus_keyword, `${product.title} ${location.city}`] } : {}),
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
  const gen = await getProductPage(service.id, location.id, product.id);
  if (gen?.status === "draft") notFound();
  const genLive = gen?.status === "published" ? gen : null;
  const faqs: { q: string; a: string }[] = Array.isArray(genLive?.faqs) ? (genLive!.faqs as any[]).filter((f) => f?.q && f?.a) : [];
  const siblingProducts = await getSiblingProducts(service.id, location.id, product.id);

  const pageUrl = `${siteUrl}/services/${params.slug}/${params.location}/${params.product}`;
  const primarySlug = genLive ? await getPrimaryServiceSlug(product.id, location.id) : null;
  const canonical = genLive ? `${siteUrl}/services/${primarySlug || params.slug}/${params.location}/${params.product}` : seo?.canonical_url || pageUrl;

  const featuredImageUrl = product.image_url
    ? convertToDirectImageUrl(product.image_url)
    : "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg";

  let galleryImages: string[] = [];
  try {
    if (Array.isArray(product.gallery_images)) galleryImages = product.gallery_images;
    else if (typeof product.gallery_images === "string")
      galleryImages = JSON.parse(product.gallery_images);
  } catch {}
  galleryImages = galleryImages
    .map((url: string) => convertToDirectImageUrl(url))
    .filter(Boolean);

  const schemaJson =
    seo?.schema_json && Object.keys(seo.schema_json).length > 0
      ? seo.schema_json
      : buildLocationSchema(product, location, {
          seo_title: seo?.meta_title,
          seo_description: seo?.meta_description,
          canonical_url: canonical,
        });

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
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }),
          }}
        />
      )}

      <div className="min-h-screen pt-28">

        <ShowroomHero
          crumbs={
            <>
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <Link href="/services" className="hover:text-white transition">Services</Link>
              <span>/</span>
              <Link href={`/services/${params.slug}`} className="hover:text-white transition">{service.title}</Link>
              <span>/</span>
              <Link href={`/services/${params.slug}/${params.location}`} className="hover:text-white transition">{location.city}</Link>
              <span>/</span>
              <span className="text-white">{product.title}</span>
            </>
          }
          chip={`Showroom · ${service.title}`}
          title={<>{product.title} in {location.city}</>}
          summary={product.summary}
          price={product.price}
          image={featuredImageUrl}
          imageAlt={`${product.title} in ${location.city}`}
          productId={product.id}
          bookLabel={`Book in ${location.city}`}
          meta={
            <span className="glass inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-1.5 text-white/85">
              <span>📍</span>
              {location.city}{location.state ? `, ${location.state}` : ""}
              <span>·</span>
              <Link href={`/services/${params.slug}/${params.location}`} className="text-orange-200 hover:text-white">
                See all {service.title} in {location.city} →
              </Link>
            </span>
          }
        />

        {/* Main grid */}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 px-4 pb-20">

          {/* Sidebar */}
          <aside className="order-1 lg:order-2">
            <Card className="bg-white/[0.05] border-terracotta-500/20 sticky top-32 p-6 space-y-6 rounded-2xl shadow-xl">
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
              <Button
                asChild
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 text-lg rounded-xl"
              >
                <Link href="tel:+919063679687">
                  <Phone className="mr-3 h-6 w-6" /> Book in {location.city}
                </Link>
              </Button>
              <p className="text-xs text-cream-400 text-center">
                Or{" "}
                <Link href="/contact" className="text-terracotta-400 hover:underline">
                  send an enquiry
                </Link>
              </p>
            </Card>
          </aside>

          {/* Content */}
          <section className="order-2 lg:order-1 lg:col-span-2 space-y-12">

            {genLive?.intro && (
              <section className="space-y-4 text-cream-300">
                <h2 className="text-2xl font-bold text-cream-50">{product.title} in {location.city}</h2>
                {String(genLive.intro).split(/\n\s*\n/).map((p: string, i: number) => <p key={i}>{p}</p>)}
              </section>
            )}

            {galleryImages.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-cream-50 mb-5">Gallery</h2>
                <Lightbox images={galleryImages} title={`${product.title} in ${location.city}`} />
              </section>
            )}

            {product.highlights?.length > 0 && (
              <Card className="bg-white/[0.05] border border-terracotta-500/20 rounded-2xl shadow-xl">
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

            <Card className="bg-white/[0.05] border border-terracotta-500/20 rounded-2xl shadow-xl">
              <CardContent className="p-8 md:p-10">
                <h2 className="text-3xl font-bold text-cream-50 mb-8 border-b border-terracotta-500/20 pb-4">
                  Product Details
                </h2>
                <div
                  className="event-description"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </CardContent>
            </Card>

            {faqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-cream-50 mb-5">Questions about {product.title} in {location.city}</h2>
                <div className="space-y-4">
                  {faqs.map((f, i) => (
                    <div key={i} className="rounded-2xl border border-terracotta-500/20 bg-white/[0.05] p-5">
                      <h3 className="mb-1 font-semibold text-cream-50">{f.q}</h3>
                      <p className="text-cream-300">{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {siblingProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-cream-50 mb-6">
                  More {service.title} in {location.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {siblingProducts.map((p: any) => (
                    <TiltCard key={p.id} max={9} className="h-full rounded-xl"><Card className="h-full bg-white/[0.05] border-terracotta-500/20 hover:border-orange-400/50 transition-colors">
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
                          <Link href={`/services/${params.slug}/${params.location}/${p.slug}`}>
                            View in {location.city}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card></TiltCard>
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
