import type { Benchmark } from "@prisma/client";
import type { BenchmarkRef } from "@/types/api";

export type BenchmarkRefRecord = Pick<
  Benchmark,
  "slug" | "name" | "category" | "unit" | "higherIsBetter"
>;

/** Keep the public benchmark shape independent from Prisma records. */
export function mapBenchmarkRef(record: BenchmarkRefRecord): BenchmarkRef {
  return {
    slug: record.slug,
    name: record.name,
    category: record.category,
    unit: record.unit,
    higherIsBetter: record.higherIsBetter,
  };
}
