import { notFound } from "@/lib/api/errors";
import type { PricePerformanceQuery } from "@/lib/validators/insights";
import { mapPricePerformancePoint } from "@/server/mappers/insights.mapper";
import { findPricePerformanceRecords } from "@/server/repositories/insights.repo";
import { findBenchmarkBySlug, findFirstBenchmark } from "@/server/repositories/rankings.repo";
import type { PricePerformancePointDTO } from "@/types/api";

export async function getPricePerformancePoints(
  query: PricePerformanceQuery,
): Promise<PricePerformancePointDTO[]> {
  const benchmark = query.benchmark
    ? await findBenchmarkBySlug(query.benchmark)
    : await findFirstBenchmark();

  if (!benchmark) {
    if (query.benchmark) throw notFound("Benchmark");
    return [];
  }

  const records = await findPricePerformanceRecords(benchmark.id);
  return records.flatMap((record) => {
    const point = mapPricePerformancePoint(record);
    return point ? [point] : [];
  });
}
