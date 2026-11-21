import { AppError } from "@/lib/api/errors";
import { mapBenchmarkRef } from "@/server/mappers/benchmark.mapper";
import { mapModelSummary } from "@/server/mappers/model.mapper";
import { findModelsForCompareBySlugs } from "@/server/repositories/compare.repo";
import type { BenchmarkRef, ModelCompareDTO } from "@/types/api";

export type CompareScoreInput = {
  benchmark: BenchmarkRef;
  score: number;
};

export type ComparableModelInput = {
  slug: string;
  scores: readonly CompareScoreInput[];
};

export type CompareBenchmarkResult = ModelCompareDTO["benchmarks"][number];

/**
 * Align benchmark scores across the selected models. A winner is only named
 * when at least two models have a score and exactly one model leads that row.
 */
export function alignCompareBenchmarks(
  models: readonly ComparableModelInput[],
): CompareBenchmarkResult[] {
  const benchmarkRows = new Map<
    string,
    { benchmark: BenchmarkRef; scoresByModel: Map<string, number> }
  >();

  for (const model of models) {
    for (const score of model.scores) {
      const existing = benchmarkRows.get(score.benchmark.slug);
      if (existing) {
        existing.scoresByModel.set(model.slug, score.score);
      } else {
        benchmarkRows.set(score.benchmark.slug, {
          benchmark: score.benchmark,
          scoresByModel: new Map([[model.slug, score.score]]),
        });
      }
    }
  }

  return [...benchmarkRows.values()]
    .sort((left, right) =>
      left.benchmark.category.localeCompare(right.benchmark.category) ||
      left.benchmark.name.localeCompare(right.benchmark.name) ||
      left.benchmark.slug.localeCompare(right.benchmark.slug),
    )
    .map(({ benchmark, scoresByModel }) => {
      const scores: Record<string, number | null> = {};
      const presentScores: Array<{ slug: string; score: number }> = [];

      for (const model of models) {
        const score = scoresByModel.get(model.slug);
        scores[model.slug] = score ?? null;
        if (score !== undefined) {
          presentScores.push({ slug: model.slug, score });
        }
      }

      let bestModelSlug: string | null = null;
      if (presentScores.length >= 2) {
        const bestScore = presentScores.reduce(
          (best, current) =>
            benchmark.higherIsBetter
              ? Math.max(best, current.score)
              : Math.min(best, current.score),
          presentScores[0].score,
        );
        const leaders = presentScores.filter((entry) => entry.score === bestScore);
        if (leaders.length === 1) {
          bestModelSlug = leaders[0].slug;
        }
      }

      return { benchmark, scores, bestModelSlug };
    });
}

export async function compareModels(slugs: readonly string[]): Promise<ModelCompareDTO> {
  const records = await findModelsForCompareBySlugs(slugs);
  const recordBySlug = new Map(records.map((record) => [record.slug, record]));
  const missingSlugs = slugs.filter((slug) => !recordBySlug.has(slug));

  if (missingSlugs.length > 0) {
    throw new AppError(
      404,
      "NOT_FOUND",
      `Models not found: ${missingSlugs.join(", ")}`,
      { missing: missingSlugs },
    );
  }

  // Rebuild in request order; the database's IN query does not preserve it.
  const orderedRecords = slugs.map((slug) => recordBySlug.get(slug)!);
  const alignedModels: ComparableModelInput[] = orderedRecords.map((record) => ({
    slug: record.slug,
    scores: record.scores.map((score) => ({
      benchmark: mapBenchmarkRef(score.benchmark),
      score: score.score,
    })),
  }));

  return {
    models: orderedRecords.map(mapModelSummary),
    benchmarks: alignCompareBenchmarks(alignedModels),
  };
}
