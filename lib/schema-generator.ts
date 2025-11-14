// lib/schema-generator.ts
export function generateLocationSchema({
  type,
  title,
  description,
  image,
  locationName,
  canonical,
}) {
  return {
    "@context": "https://schema.org",
    "@type": type === "event" ? "Event" : "Service",
    name: `${title} in ${locationName}`,
    description,
    image,
    url: canonical,
    areaServed: {
      "@type": "City",
      name: locationName,
    },
    provider: {
      "@type": "Organization",
      name: "Retreat Arcade Events",
      url: "https://www.retreatarcade.in",
    },
  };
}
