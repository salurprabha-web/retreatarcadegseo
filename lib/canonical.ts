// lib/canonical.ts
export function buildCanonical(productType, productSlug, locationSlug?) {
  if (!locationSlug)
    return `https://www.retreatarcade.in/${productType}s/${productSlug}`;

  return `https://www.retreatarcade.in/${productType}s/${productSlug}/${locationSlug}`;
}
