import { BenchmarkCategory } from "@prisma/client";
import { z } from "zod";
import { modelSlugSchema } from "@/lib/validators/models";

const BENCHMARK_CATEGORIES = Object.values(BenchmarkCategory) as [
  BenchmarkCategory,
  ...BenchmarkCategory[],
];

export const rankingsQuerySchema = z.object({
  benchmark: modelSlugSchema.optional(),
  category: z.enum(BENCHMARK_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type RankingsQueryInput = z.infer<typeof rankingsQuerySchema>;
