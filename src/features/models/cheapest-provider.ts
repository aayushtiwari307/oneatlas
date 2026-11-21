import type { OfferingDTO } from "@/types/api";

/** Returns every provider tied for the lowest active input-token price. */
export function getCheapestProviderSlugs(offerings: readonly OfferingDTO[]): string[] {
  if (offerings.length === 0) return [];

  const lowestPrice = Math.min(...offerings.map((offering) => offering.inputPricePer1M));
  return offerings
    .filter((offering) => offering.inputPricePer1M === lowestPrice)
    .map((offering) => offering.provider.slug)
    .sort((left, right) => left.localeCompare(right));
}
