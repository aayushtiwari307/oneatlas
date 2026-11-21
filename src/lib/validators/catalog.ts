import { BenchmarkCategory } from "@prisma/client";
import { z } from "zod";

const BENCHMARK_CATEGORIES = Object.values(BenchmarkCategory) as [
  BenchmarkCategory,
  ...BenchmarkCategory[],
];

/** List/detail endpoints without filters reject unexpected query parameters. */
export const emptyQuerySchema = z.object({}).strict();

export const benchmarksQuerySchema = z
  .object({
    category: z.preprocess(
      (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
      z.enum(BENCHMARK_CATEGORIES).optional(),
    ),
  })
  .strict();

export const catalogSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case slug");

export const catalogSlugParamsSchema = z.object({ slug: catalogSlugSchema }).strict();
export type BenchmarksQuery = z.infer<typeof benchmarksQuerySchema>;
