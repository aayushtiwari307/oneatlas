import type { BenchmarkCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const benchmarkListArgs = {
  include: { _count: { select: { scores: true } } },
} satisfies Prisma.BenchmarkDefaultArgs;

export type BenchmarkListRecord = Prisma.BenchmarkGetPayload<typeof benchmarkListArgs>;

export async function findBenchmarks(category?: BenchmarkCategory): Promise<BenchmarkListRecord[]> {
  return prisma.benchmark.findMany({
    where: category === undefined ? {} : { category },
    ...benchmarkListArgs,
    orderBy: [{ category: "asc" }, { name: "asc" }, { slug: "asc" }],
  });
}
