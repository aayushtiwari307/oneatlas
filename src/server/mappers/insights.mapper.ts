import type { PricePerformancePointDTO } from "@/types/api";
import type { PricePerformanceRecord } from "@/server/repositories/insights.repo";

/** Convert Prisma Decimal prices at the mapper boundary and apply the agreed 3:1 blend. */
export function mapPricePerformancePoint(
  record: PricePerformanceRecord,
): PricePerformancePointDTO | null {
  const offering = record.offerings[0];
  const score = record.scores[0];
  if (!offering || !score) return null;

  const inputPrice = offering.inputPricePer1M.toNumber();
  const outputPrice = offering.outputPricePer1M.toNumber();
  const blendedPrice = (3 * inputPrice + outputPrice) / 4;

  if (!Number.isFinite(blendedPrice) || blendedPrice < 0 || !Number.isFinite(score.score)) {
    return null;
  }

  return {
    slug: record.slug,
    name: record.name,
    lab: record.lab,
    score: score.score,
    blendedPrice,
  };
}
