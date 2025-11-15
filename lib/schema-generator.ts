// lib/schema-generator.ts

export interface SchemaInput {
  type: "event" | "service";
  title: string;
  description?: string | null;
  image?: string | null;
  locationName?: string | null;
  url: string;
}

export function generateLocationSchema({
  type,
  title,
  description,
  image,
  locationName,
  url,
}: SchemaInput) {
  const base: any = {
    "@context": "https://schema.org",
    "@type": type === "event" ? "Event" : "Service",
    name: title,
    description: description || "",
    url,
  };

  if (image) {
    base.image = image;
  }

  if (type === "event") {
    base.eventStatus = "EventScheduled";
    base.eventAttendanceMode = "OfflineEventAttendanceMode";
    base.location = {
      "@type": "Place",
      name: locationName || "",
      address: locationName || "",
    };
  } else {
    // service schema
    base.areaServed = locationName || "";
  }

  return base;
}
