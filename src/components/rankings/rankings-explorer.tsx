"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, ExternalLink, RefreshCw } from "lucide-react";
import type { BenchmarkDTO, RankingsDTO } from "@/types/api";
import { getRankingBarPercent } from "@/features/rankings/score-bars";

type ApiEnvelope<T> = { data: T };
type ApiError = { error?: { message?: string } };
type BenchmarkCategoryKey = BenchmarkDTO["category"];

const BENCHMARK_CATEGORIES: readonly BenchmarkCategoryKey[] = [
  "GENERAL",
  "KNOWLEDGE",
  "REASONING",
  "CODING",
  "MATH",
  "MULTIMODAL",
  "AGENTIC",
];

const CATEGORY_LABELS: Record<BenchmarkCategoryKey, string> = {
  GENERAL: "General",
  KNOWLEDGE: "Knowledge",
  REASONING: "Reasoning",
  CODING: "Coding",
  MATH: "Math",
  MULTIMODAL: "Multimodal",
  AGENTIC: "Agentic",
};

function isBenchmarkCategory(value: string): value is BenchmarkCategoryKey {
  return (BENCHMARK_CATEGORIES as readonly string[]).includes(value);
}

async function readApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const errorPayload = payload as ApiError;
    throw new Error(errorPayload.error?.message ?? `Request failed (${response.status})`);
  }

  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("The API returned an unexpected response.");
  }

  return (payload as ApiEnvelope<T>).data;
}

function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 0 && value < 0.01 ? 6 : 2,
  }).format(value);
}

function formatScore(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function RankingsSkeleton() {
  return (
    <div className="panel overflow-hidden p-5" aria-label="Loading rankings">
      <div className="skeleton h-5 w-48" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-white/[.06] py-4">
            <div className="skeleton h-7 w-8" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-40 max-w-full" />
              <div className="skeleton mt-2 h-3 w-24" />
            </div>
            <div className="skeleton h-4 w-20" />
            <div className="skeleton hidden h-2 w-32 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-12 text-center">
      <AlertTriangle size={22} className="text-amber-300" />
      <h2 className="mt-4 text-base font-semibold text-white">Rankings could not be loaded</h2>
      <p className="mt-2 max-w-xl text-xs leading-6 text-slate-400">{message}</p>
      <button type="button" onClick={retry} className="control-button control-button-active mt-5">
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

function RankingTable({ data }: { data: RankingsDTO }) {
  const scores = data.entries.map((entry) => entry.score);
  const directionLabel = data.benchmark.higherIsBetter ? "Higher is better" : "Lower is better";

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 sm:px-5">
        <div>
          <div className="text-sm font-semibold text-white">{data.benchmark.name}</div>
          <p className="mt-1 text-[11px] text-slate-500">
            {data.entries.length} ranked {data.entries.length === 1 ? "model" : "models"} · Scores shown in {data.benchmark.unit}
          </p>
        </div>
        <span className="pill pill-cyan inline-flex items-center gap-1.5">
          {data.benchmark.higherIsBetter ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          {directionLabel}
        </span>
      </div>

      {data.entries.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <BarChart3 size={22} className="mx-auto text-slate-600" />
          <h3 className="mt-4 text-sm font-semibold text-white">No scores recorded yet</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">This benchmark has no model score records in the current catalogue.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-white/[.025] text-[10px] uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th scope="col" className="w-16 px-4 py-3 font-semibold">Rank</th>
                <th scope="col" className="min-w-[250px] px-4 py-3 font-semibold">Model</th>
                <th scope="col" className="w-32 px-4 py-3 font-semibold">Score</th>
                <th scope="col" className="min-w-[190px] px-4 py-3 font-semibold">Relative performance</th>
                <th scope="col" className="w-40 px-4 py-3 font-semibold">Input / 1M tokens</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => {
                const barPercent = getRankingBarPercent(
                  entry.score,
                  scores,
                  data.benchmark.higherIsBetter,
                );

                return (
                  <tr key={entry.model.slug} className="border-t border-white/[.06] transition hover:bg-white/[.02]">
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums ${entry.rank === 1 ? "border-cyan-200/25 bg-cyan-200/[.08] text-cyan-100" : "border-white/[.08] text-slate-400"}`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <Link href={`/models/${entry.model.slug}`} className="text-sm font-semibold text-slate-100 transition hover:text-cyan-200">
                        {entry.model.name}
                      </Link>
                      <div className="mt-1 text-[11px]">
                        <Link href={`/labs/${entry.model.lab.slug}`} className="inline-flex items-center gap-1 text-slate-500 transition hover:text-cyan-200">
                          {entry.model.lab.name} <ExternalLink size={9} />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm font-semibold tabular-nums text-white">{formatScore(entry.score)}</span>
                      <span className="ml-1 text-[10px] text-slate-500">{data.benchmark.unit}</span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-white/[.07]"
                          role="meter"
                          aria-label={`${entry.model.name} relative benchmark performance`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={barPercent}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-[width] duration-300"
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[10px] tabular-nums text-slate-500">{Math.round(barPercent)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-xs tabular-nums text-slate-300">
                      {formatPrice(entry.model.minInputPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-white/[.06] px-4 py-3 text-[10px] leading-5 text-slate-600 sm:px-5">
        Ranking positions use competition ranking for tied scores. Prices show the cheapest active provider input rate where available.
      </div>
    </div>
  );
}

export function RankingsExplorer() {
  const [queryState, setQueryState] = useQueryStates(
    {
      category: parseAsString.withDefault("KNOWLEDGE"),
      benchmark: parseAsString.withDefault(""),
    },
    { history: "push" },
  );

  const category = isBenchmarkCategory(queryState.category)
    ? queryState.category
    : "KNOWLEDGE";

  const benchmarksQuery = useQuery({
    queryKey: ["rankings-benchmarks", category],
    queryFn: () =>
      readApi<BenchmarkDTO[]>(`/api/benchmarks?category=${encodeURIComponent(category)}`),
    staleTime: 60_000,
  });

  const selectedBenchmark: BenchmarkDTO | undefined =
    benchmarksQuery.data?.find((benchmark) => benchmark.slug === queryState.benchmark) ??
    benchmarksQuery.data?.[0];

  useEffect(() => {
    if (queryState.category !== category) {
      void setQueryState({ category, benchmark: null });
      return;
    }
    if (!benchmarksQuery.isSuccess) return;

    const nextBenchmark = benchmarksQuery.data[0]?.slug ?? "";
    const currentIsValid = benchmarksQuery.data.some(
      (benchmark) => benchmark.slug === queryState.benchmark,
    );

    if (!currentIsValid && queryState.benchmark !== nextBenchmark) {
      void setQueryState({ benchmark: nextBenchmark || null });
    }
  }, [
    benchmarksQuery.data,
    benchmarksQuery.isSuccess,
    category,
    queryState.benchmark,
    queryState.category,
    setQueryState,
  ]);

  const rankingsQuery = useQuery({
    queryKey: ["rankings", category, selectedBenchmark?.slug],
    queryFn: () =>
      readApi<RankingsDTO>(
        `/api/rankings?benchmark=${encodeURIComponent(selectedBenchmark!.slug)}&category=${encodeURIComponent(category)}`,
      ),
    enabled: Boolean(selectedBenchmark),
    staleTime: 60_000,
  });

  async function selectCategory(nextCategory: BenchmarkCategoryKey) {
    await setQueryState({ category: nextCategory, benchmark: null });
  }

  async function selectBenchmark(slug: string) {
    await setQueryState({ benchmark: slug || null });
  }

  const retry = () => {
    if (benchmarksQuery.isError) void benchmarksQuery.refetch();
    if (rankingsQuery.isError) void rankingsQuery.refetch();
  };

  const error = benchmarksQuery.error ?? rankingsQuery.error;
  const loading = benchmarksQuery.isPending || (Boolean(selectedBenchmark) && rankingsQuery.isPending);

  return (
    <div className="shell-width pb-24 pt-10 sm:pt-14">
      <div className="mb-8 max-w-3xl">
        <div className="eyebrow flex items-center gap-2"><BarChart3 size={12} /> Model intelligence</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">Rankings & benchmarks</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Explore model performance across evaluation suites. Rankings follow each benchmark’s scoring direction and preserve tied positions.
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200/15 bg-amber-200/[.045] px-4 py-3 text-[11px] leading-5 text-amber-100/80">
        <strong className="font-semibold text-amber-100">Illustrative benchmark data.</strong> Scores in this demo catalogue are illustrative, not verified published leaderboard results. Check each benchmark’s original source before relying on a score.
      </div>

      <section aria-label="Benchmark filters" className="panel mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <div className="field-label" id="benchmark-category-label">Benchmark category</div>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="benchmark-category-label">
              {BENCHMARK_CATEGORIES.map((item) => {
                const active = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => void selectCategory(item)}
                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition ${active ? "border-cyan-200/30 bg-cyan-200/[.1] text-cyan-100" : "border-white/[.08] text-slate-500 hover:border-white/20 hover:text-slate-200"}`}
                  >
                    {CATEGORY_LABELS[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:max-w-md">
            <label htmlFor="benchmark-select" className="field-label mb-0">Benchmark</label>
            <select
              id="benchmark-select"
              className="field-control"
              value={selectedBenchmark?.slug ?? ""}
              onChange={(event) => void selectBenchmark(event.target.value)}
              disabled={benchmarksQuery.isPending || (benchmarksQuery.data?.length ?? 0) === 0}
            >
              {(benchmarksQuery.data ?? []).map((benchmark) => (
                <option key={benchmark.slug} value={benchmark.slug}>
                  {benchmark.name} · {benchmark.modelCount} models
                </option>
              ))}
            </select>
            {selectedBenchmark ? (
              <p className="text-[10px] leading-5 text-slate-500">
                {selectedBenchmark.higherIsBetter ? "Higher scores rank first." : "Lower scores rank first."} Benchmark unit: {selectedBenchmark.unit}.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? <RankingsSkeleton /> : null}
      {error ? <RankingsError message={error.message} retry={retry} /> : null}
      {!loading && !error && benchmarksQuery.isSuccess && !selectedBenchmark ? (
        <div className="panel px-6 py-14 text-center">
          <BarChart3 size={22} className="mx-auto text-slate-600" />
          <h2 className="mt-4 text-sm font-semibold text-white">No benchmarks in this category</h2>
          <p className="mt-2 text-xs text-slate-500">Choose another category to explore its leaderboard.</p>
        </div>
      ) : null}
      {!loading && !error && rankingsQuery.data ? <RankingTable data={rankingsQuery.data} /> : null}
    </div>
  );
}
