"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { BenchmarkDTO, PricePerformancePointDTO } from "@/types/api";
import { layoutScatterPoints } from "@/features/insights/scatter-layout";

type ApiSuccess<T> = { data: T };
type ApiFailure = { error?: { message?: string } };

async function getApiData<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json() as ApiSuccess<T> | ApiFailure;
  if (!response.ok || !("data" in payload)) {
    const message = "error" in payload ? payload.error?.message : undefined;
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return payload.data;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 0 && value < 0.01 ? 6 : 3,
  }).format(value);
}

function formatScore(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export function PricePerformanceChart() {
  const [chosenBenchmark, setChosenBenchmark] = useState("");
  const benchmarksQuery = useQuery({
    queryKey: ["insights", "benchmarks"],
    queryFn: () => getApiData<BenchmarkDTO[]>("/api/benchmarks"),
    staleTime: 60_000,
  });
  const benchmarks = benchmarksQuery.data ?? [];
  const selectedBenchmark = benchmarks.find((item) => item.slug === chosenBenchmark) ?? benchmarks[0];

  const pointsQuery = useQuery({
    queryKey: ["insights", "price-performance", selectedBenchmark?.slug],
    queryFn: () => getApiData<PricePerformancePointDTO[]>(`/api/insights/price-performance?benchmark=${encodeURIComponent(selectedBenchmark?.slug ?? "")}`),
    enabled: Boolean(selectedBenchmark?.slug),
    staleTime: 60_000,
  });

  const points = pointsQuery.data ?? [];
  const chartWidth = 760;
  const chartHeight = 360;
  const padding = 58;
  const plotted = selectedBenchmark
    ? layoutScatterPoints(points, selectedBenchmark.higherIsBetter, chartWidth, chartHeight, padding)
    : [];
  const minPrice = points.length ? Math.min(...points.map((point) => point.blendedPrice)) : 0;
  const maxPrice = points.length ? Math.max(...points.map((point) => point.blendedPrice)) : 0;
  const minScore = points.length ? Math.min(...points.map((point) => point.score)) : 0;
  const maxScore = points.length ? Math.max(...points.map((point) => point.score)) : 0;

  return (
    <section className="my-16" aria-labelledby="price-performance-title">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow">Find the trade-off</div>
          <h2 id="price-performance-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Price vs. performance</h2>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">Compare benchmark scores against blended provider pricing. Lower cost is further left; the benchmark&apos;s preferred score direction is higher on the chart.</p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="insight-benchmark" className="field-label">Benchmark</label>
          <select
            id="insight-benchmark"
            className="field-control"
            value={selectedBenchmark?.slug ?? ""}
            onChange={(event) => setChosenBenchmark(event.currentTarget.value)}
            disabled={benchmarksQuery.isPending || benchmarks.length === 0}
          >
            {benchmarks.map((benchmark) => (
              <option value={benchmark.slug} key={benchmark.slug}>{benchmark.name} · {benchmark.category.toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {benchmarksQuery.isPending ? (
        <div className="panel skeleton h-[340px]" role="status" aria-label="Loading benchmark choices" />
      ) : null}
      {benchmarksQuery.isError ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-5" role="alert">
          <span className="inline-flex items-center gap-2 text-sm text-rose-200"><AlertCircle size={15} /> {benchmarksQuery.error.message}</span>
          <button type="button" className="control-button" onClick={() => void benchmarksQuery.refetch()}><RefreshCw size={12} /> Retry</button>
        </div>
      ) : null}

      {!benchmarksQuery.isPending && !benchmarksQuery.isError && benchmarks.length === 0 ? (
        <div className="panel p-7 text-sm text-slate-400">No benchmarks are available yet. Add benchmark data to the catalogue to explore this view.</div>
      ) : null}

      {selectedBenchmark && pointsQuery.isPending ? (
        <div className="panel skeleton h-[340px]" role="status" aria-label="Loading price-performance chart" />
      ) : null}
      {selectedBenchmark && pointsQuery.isError ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-5" role="alert">
          <span className="inline-flex items-center gap-2 text-sm text-rose-200"><AlertCircle size={15} /> {pointsQuery.error.message}</span>
          <button type="button" className="control-button" onClick={() => void pointsQuery.refetch()}><RefreshCw size={12} /> Retry</button>
        </div>
      ) : null}

      {selectedBenchmark && pointsQuery.isSuccess && points.length === 0 ? (
        <div className="panel p-7 text-sm text-slate-400">No models have both a score for {selectedBenchmark.name} and an active priced provider offering.</div>
      ) : null}

      {selectedBenchmark && pointsQuery.isSuccess && plotted.length > 0 ? (
        <div className="panel overflow-hidden p-3 sm:p-5">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label={`Scatter chart of ${points.length} models by blended price and ${selectedBenchmark.name} score`}
              className="h-auto min-w-[620px] w-full"
            >
              {Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const y = padding + ratio * (chartHeight - padding * 2);
                const scoreValue = selectedBenchmark.higherIsBetter
                  ? maxScore - ratio * (maxScore - minScore)
                  : minScore + ratio * (maxScore - minScore);
                return (
                  <g key={`y-${index}`}>
                    <line x1={padding} x2={chartWidth - padding} y1={y} y2={y} stroke="rgba(148,163,184,.15)" strokeDasharray="3 5" />
                    <text x={padding - 10} y={y + 4} textAnchor="end" fill="#8191a8" fontSize="10">{formatScore(scoreValue)}</text>
                  </g>
                );
              })}
              {Array.from({ length: 5 }, (_, index) => {
                const ratio = index / 4;
                const x = padding + ratio * (chartWidth - padding * 2);
                const priceValue = minPrice + ratio * (maxPrice - minPrice);
                return (
                  <g key={`x-${index}`}>
                    <line x1={x} x2={x} y1={padding} y2={chartHeight - padding} stroke="rgba(148,163,184,.10)" strokeDasharray="3 5" />
                    <text x={x} y={chartHeight - padding + 20} textAnchor="middle" fill="#8191a8" fontSize="10">{formatPrice(priceValue)}</text>
                  </g>
                );
              })}
              <line x1={padding} x2={padding} y1={padding} y2={chartHeight - padding} stroke="rgba(148,163,184,.4)" />
              <line x1={padding} x2={chartWidth - padding} y1={chartHeight - padding} y2={chartHeight - padding} stroke="rgba(148,163,184,.4)" />
              <text x={chartWidth / 2} y={chartHeight - 8} textAnchor="middle" fill="#a8b7ca" fontSize="11">Blended price · USD per 1M tokens</text>
              <text transform={`translate(15 ${chartHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#a8b7ca" fontSize="11">{selectedBenchmark.name} · {selectedBenchmark.unit}</text>
              {plotted.map((point) => (
                <circle key={point.slug} cx={point.x} cy={point.y} r="6" fill="#67e8f9" fillOpacity=".8" stroke="#cffafe" strokeWidth="1.25">
                  <title>{`${point.name} · ${point.lab.name} · score ${formatScore(point.score)} ${selectedBenchmark.unit} · ${formatPrice(point.blendedPrice)} / 1M blended`}</title>
                </circle>
              ))}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
            <span>{points.length} model{points.length === 1 ? "" : "s"} · lower blended price is better for cost</span>
            <span>Blended price = (3 × input + output) ÷ 4</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {points.slice(0, 8).map((point) => (
              <Link href={`/models/${encodeURIComponent(point.slug)}`} key={point.slug} className="text-[10px] text-cyan-200 hover:text-white">
                {point.name} <span className="text-slate-600">· {formatPrice(point.blendedPrice)}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[10px] leading-5 text-amber-100/65">Benchmark values may include illustrative demo records. Check the score provenance on each model detail page before relying on a comparison.</p>
    </section>
  );
}
