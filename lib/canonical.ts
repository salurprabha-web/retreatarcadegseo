// lib/canonical.ts

export function buildCanonical(
  productType: "event" | "service",
  productSlug: string,
  locationSlug?: string | null
): string {
  if (!productSlug) return "";

  if (!locationSlug) {
    return `https://www.retreatarcade.in/${productType}s/${productSlug}`;
  }

  return `https://www.retreatarcade.in/${productType}s/${productSlug}/${locationSlug}`;
}
