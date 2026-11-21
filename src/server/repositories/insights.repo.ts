import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type PricePerformanceRecord = {
  slug: string;
  name: string;
  lab: { slug: string; name: string };
  offerings: Array<{
    inputPricePer1M: Prisma.Decimal;
    outputPricePer1M: Prisma.Decimal;
  }>;
  scores: Array<{ score: number; source: string | null }>;
};

/** Fetch a single benchmark score and the cheapest active offering per model. */
export async function findPricePerformanceRecords(
  benchmarkId: string,
): Promise<PricePerformanceRecord[]> {
  return prisma.model.findMany({
    where: {
      offerings: { some: { isActive: true } },
      scores: { some: { benchmarkId } },
    },
    select: {
      slug: true,
      name: true,
      lab: { select: { slug: true, name: true } },
      offerings: {
        where: { isActive: true },
        orderBy: [
          { inputPricePer1M: "asc" },
          { provider: { slug: "asc" } },
        ],
        take: 1,
        select: {
          inputPricePer1M: true,
          outputPricePer1M: true,
        },
      },
      scores: {
        where: { benchmarkId },
        take: 1,
        select: { score: true, source: true },
      },
    },
    orderBy: [
      { minInputPrice: { sort: "asc", nulls: "last" } },
      { slug: "asc" },
    ],
    take: 200,
  });
}
