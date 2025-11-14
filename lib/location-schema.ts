export function buildLocationSchema(product: any, location: any, lp: any) {
  const fullTitle = lp?.seo_title || lp?.title;
  const desc = lp?.seo_description || product.summary || product.description;

  return {
    "@context": "https://schema.org",
    "@type": product.price ? "Product" : "Service",

    name: fullTitle,
    description: desc,

    image: product.image_url ? [product.image_url] : undefined,

    offers: product.price
      ? {
          "@type": "Offer",
          price: String(product.price),
          priceCurrency: "INR",
          url: lp?.canonical_url,
          availability: "https://schema.org/InStock",
        }
      : undefined,

    areaServed: {
      "@type": "City",
      name: location.city,
    },

    provider: {
      "@type": "LocalBusiness",
      name: "Retreat Arcade",
      url: "https://www.retreatarcade.in",
    }
  };
}
