import { Prisma } from "@prisma/client";

export type OfferingPrice = {
  inputPricePer1M: Prisma.Decimal;
  outputPricePer1M: Prisma.Decimal;
  isActive: boolean;
};

export type ModelMinPrices = {
  minInputPrice: Prisma.Decimal | null;
  minOutputPrice: Prisma.Decimal | null;
};

/**
 * Select the active offering with the lowest input price. If input prices tie,
 * the lower output price wins so the result is deterministic regardless of
 * database row order. Both denormalized prices come from the same offering.
 */
export function computeModelMinPrices(
  offerings: readonly OfferingPrice[],
): ModelMinPrices {
  let cheapest: OfferingPrice | null = null;

  for (const offering of offerings) {
    if (!offering.isActive) {
      continue;
    }

    if (!cheapest) {
      cheapest = offering;
      continue;
    }

    const hasLowerInputPrice = offering.inputPricePer1M.lessThan(cheapest.inputPricePer1M);
    const hasEqualInputPrice = offering.inputPricePer1M.equals(cheapest.inputPricePer1M);
    const hasLowerOutputPrice = offering.outputPricePer1M.lessThan(cheapest.outputPricePer1M);

    if (hasLowerInputPrice || (hasEqualInputPrice && hasLowerOutputPrice)) {
      cheapest = offering;
    }
  }

  return {
    minInputPrice: cheapest?.inputPricePer1M ?? null,
    minOutputPrice: cheapest?.outputPricePer1M ?? null,
  };
}
