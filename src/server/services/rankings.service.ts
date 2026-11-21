import type { BenchmarkCategory } from "@prisma/client";
import { notFound } from "@/lib/api/errors";
import { mapBenchmarkRef } from "@/server/mappers/benchmark.mapper";
import { mapModelSummary } from "@/server/mappers/model.mapper";
import {
  findBenchmarkBySlug,
  findFirstBenchmark,
  findScoresForBenchmark,
} from "@/server/repositories/rankings.repo";
import type { ModelSummaryDTO, RankingsDTO } from "@/types/api";

export type RankingCandidate<T> = {
  modelSlug: string;
  score: number;
  value: T;
};

export type RankedCandidate<T> = {
  rank: number;
  score: number;
  value: T;
};

/** Sort in the benchmark's preferred direction and assign competition ranks. */
export function buildCompetitionRanks<T>(
  candidates: readonly RankingCandidate<T>[],
  higherIsBetter: boolean,
  limit: number,
): RankedCandidate<T>[] {
  const ordered = [...candidates].sort((left, right) => {
    const scoreOrder = higherIsBetter
      ? right.score - left.score
      : left.score - right.score;
    return scoreOrder || left.modelSlug.localeCompare(right.modelSlug);
  });

  let previousScore: number | undefined;
  let previousRank = 0;

  return ordered.slice(0, limit).map((candidate, index) => {
    const rank = index > 0 && candidate.score === previousScore ? previousRank : index + 1;
    previousScore = candidate.score;
    previousRank = rank;

    return {
      rank,
      score: candidate.score,
      value: candidate.value,
    };
  });
}

export type RankingsQuery = {
  benchmark?: string;
  category?: BenchmarkCategory;
  limit: number;
};

export async function getRankings(query: RankingsQuery): Promise<RankingsDTO> {
  const benchmark = query.benchmark
    ? await findBenchmarkBySlug(query.benchmark)
    : await findFirstBenchmark(query.category);

  if (!benchmark) {
    throw notFound(query.benchmark ? "Benchmark" : "Benchmark catalogue entry");
  }

  const scoreRecords = await findScoresForBenchmark(benchmark.id);
  const candidates: RankingCandidate<ModelSummaryDTO>[] = scoreRecords.map((record) => ({
    modelSlug: record.model.slug,
    score: record.score,
    value: mapModelSummary(record.model),
  }));

  return {
    benchmark: mapBenchmarkRef(benchmark),
    entries: buildCompetitionRanks(candidates, benchmark.higherIsBetter, query.limit).map(
      ({ rank, score, value }) => ({ rank, score, model: value }),
    ),
  };
}
