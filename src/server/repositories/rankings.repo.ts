import type { BenchmarkCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const benchmarkSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  unit: true,
  higherIsBetter: true,
} satisfies Prisma.BenchmarkSelect;

const rankingScoreArgs = {
  include: {
    model: {
      include: {
        lab: {
          select: {
            slug: true,
            name: true,
            logoUrl: true,
          },
        },
        offerings: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    },
  },
} satisfies Prisma.BenchmarkScoreDefaultArgs;

export type RankingBenchmarkRecord = Prisma.BenchmarkGetPayload<{
  select: typeof benchmarkSelect;
}>;
export type RankingScoreRecord = Prisma.BenchmarkScoreGetPayload<typeof rankingScoreArgs>;

export async function findBenchmarkBySlug(
  slug: string,
): Promise<RankingBenchmarkRecord | null> {
  return prisma.benchmark.findUnique({
    where: { slug },
    select: benchmarkSelect,
  });
}

export async function findFirstBenchmark(
  category?: BenchmarkCategory,
): Promise<RankingBenchmarkRecord | null> {
  return prisma.benchmark.findFirst({
    where: category === undefined ? {} : { category },
    select: benchmarkSelect,
    orderBy: [{ category: "asc" }, { name: "asc" }, { slug: "asc" }],
  });
}

export async function findScoresForBenchmark(
  benchmarkId: string,
): Promise<RankingScoreRecord[]> {
  return prisma.benchmarkScore.findMany({
    where: { benchmarkId },
    ...rankingScoreArgs,
  });
}
