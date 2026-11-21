"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryStates } from "nuqs";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, GitCompareArrows, RotateCcw, X } from "lucide-react";
import type { ModelCompareDTO } from "@/types/api";
import { MAX_COMPARE_MODELS, parseCompareSlugs } from "@/features/compare/compare-selection";
import { getBestCompareSlugs } from "@/features/compare/compare-metrics";
import { useCompareSelection } from "@/features/compare/compare-selection-provider";

type ApiEnvelope<T> = { data: T };
type ApiError = { error?: { message?: string } };

async function readApi<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const errorPayload = payload as ApiError;
    throw new Error(errorPayload.error?.message ?? `Request failed (${response.status})`);
  }
  return payload as T;
}

function formatPrice(value: number | null): string {
  if (value === null) return "Not listed";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
  }).format(value);
}

function formatTokens(value: number | null): string {
  return value === null
    ? "Not listed"
    : `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)} tokens`;
}

function CompareSkeleton() {
  return (
    <div className="panel space-y-4 p-5" aria-label="Loading comparison">
      <div className="skeleton h-5 w-48" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}

function MetricRow({
  label,
  values,
  bestSlugs,
}: {
  label: string;
  values: Array<{ slug: string; value: string }>;
  bestSlugs: readonly string[];
}) {
  return (
    <tr className="border-t border-white/[.07]">
      <th scope="row" className="min-w-36 px-4 py-4 text-left text-[11px] font-semibold text-slate-400">{label}</th>
      {values.map((item) => {
        const isBest = bestSlugs.includes(item.slug);
        return (
          <td key={item.slug} className={`min-w-44 px-4 py-4 text-xs tabular-nums ${isBest ? "bg-emerald-300/[.07] font-semibold text-emerald-100" : "text-slate-300"}`}>
            <span className="inline-flex items-center gap-1.5">{isBest ? <Check size={12} className="text-emerald-300" /> : null}{item.value}</span>
          </td>
        );
      })}
    </tr>
  );
}

export function CompareWorkspace() {
  const [queryState, setQueryState] = useQueryStates(
    { models: parseAsString.withDefault("") },
    { history: "push" },
  );
  const { replace, remove, clear } = useCompareSelection();
  const slugs = parseCompareSlugs(queryState.models);
  const tooMany = slugs.length > MAX_COMPARE_MODELS;
  const query = useQuery({
    queryKey: ["model-comparison", slugs],
    queryFn: () => readApi<ApiEnvelope<ModelCompareDTO>>(
      `/api/models/compare?slugs=${encodeURIComponent(slugs.join(","))}`,
    ).then((payload) => payload.data),
    enabled: slugs.length >= 2 && !tooMany,
  });

  useEffect(() => {
    if (query.data) {
      replace(query.data.models.map((model) => ({ slug: model.slug, name: model.name })));
    }
  }, [query.data, replace]);

  function removeFromComparison(slug: string) {
    const next = slugs.filter((item) => item !== slug);
    remove(slug);
    void setQueryState({ models: next.length > 0 ? next.join(",") : null });
  }

  function clearComparison() {
    clear();
    void setQueryState({ models: null });
  }

  const models = query.data?.models ?? [];
  const inputBest = getBestCompareSlugs(models.map((model) => ({ slug: model.slug, value: model.minInputPrice })), "lower");
  const outputBest = getBestCompareSlugs(models.map((model) => ({ slug: model.slug, value: model.minOutputPrice })), "lower");
  const contextBest = getBestCompareSlugs(models.map((model) => ({ slug: model.slug, value: model.contextWindow })), "higher");
  const outputWindowBest = getBestCompareSlugs(models.map((model) => ({ slug: model.slug, value: model.maxOutput })), "higher");

  return (
    <div className="shell-width pb-24 pt-10 sm:pt-14">
      <Link href="/models" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-cyan-200">
        <ArrowLeft size={13} /> Back to model explorer
      </Link>

      <div className="mb-8 mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="eyebrow flex items-center gap-2"><GitCompareArrows size={12} /> Model intelligence</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">Compare AI models</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Compare model specifications, pricing and shared benchmark results side by side.</p>
        </div>
        {slugs.length > 0 ? <button type="button" onClick={clearComparison} className="control-button self-start sm:self-auto"><X size={13} /> Clear comparison</button> : null}
      </div>

      {tooMany ? (
        <div className="panel p-6 text-sm text-amber-100">Choose no more than four models. Remove extra models from the URL or return to the explorer.</div>
      ) : null}

      {slugs.length < 2 && !tooMany ? (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-cyan-200/15 bg-cyan-200/[.06] text-cyan-200"><GitCompareArrows size={20} /></span>
          <h2 className="mt-5 text-lg font-semibold text-white">Select at least two models</h2>
          <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">Add up to four models from the explorer. Your selection is saved in this browser and the comparison URL can be shared.</p>
          {slugs.length === 1 ? (
            <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300">
              {slugs[0]} <button type="button" onClick={() => removeFromComparison(slugs[0])} aria-label={`Remove ${slugs[0]}`} className="text-slate-500 hover:text-white"><X size={12} /></button>
            </div>
          ) : null}
          <Link href="/models" className="header-cta mt-6">Explore models <ArrowUpRight size={13} /></Link>
        </div>
      ) : null}

      {slugs.length >= 2 && !tooMany && query.isPending ? <CompareSkeleton /> : null}
      {slugs.length >= 2 && !tooMany && query.isError ? (
        <div className="panel flex flex-col items-center px-6 py-12 text-center">
          <CircleAlert size={22} className="text-rose-200" />
          <h2 className="mt-4 text-base font-semibold text-white">Comparison could not be loaded</h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-slate-400">{query.error.message}</p>
          <button type="button" className="control-button mt-5" onClick={() => void query.refetch()}><RotateCcw size={13} /> Retry</button>
        </div>
      ) : null}

      {query.isSuccess && query.data ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Comparing <span className="font-semibold text-white">{models.length}</span> models · green cells indicate the best available value for that row.</p>
            <span className="pill">Shareable URL · {models.length}/4 selected</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1524]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-white/[.025]">
                  <tr>
                    <th scope="col" className="min-w-36 px-4 py-4 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">Specification</th>
                    {models.map((model) => (
                      <th scope="col" key={model.slug} className="min-w-44 px-4 py-4 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="eyebrow truncate">{model.lab.name}</div>
                            <Link href={`/models/${encodeURIComponent(model.slug)}`} className="mt-2 block break-words text-sm font-semibold text-slate-100 hover:text-cyan-200">{model.name}</Link>
                            <span className="mt-1 block text-[10px] font-normal text-slate-500">{model.type}</span>
                          </div>
                          <button type="button" onClick={() => removeFromComparison(model.slug)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-white/10 hover:text-white" aria-label={`Remove ${model.name}`}><X size={13} /></button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <MetricRow label="Input price / 1M" values={models.map((model) => ({ slug: model.slug, value: formatPrice(model.minInputPrice) }))} bestSlugs={inputBest} />
                  <MetricRow label="Output price / 1M" values={models.map((model) => ({ slug: model.slug, value: formatPrice(model.minOutputPrice) }))} bestSlugs={outputBest} />
                  <MetricRow label="Context window" values={models.map((model) => ({ slug: model.slug, value: formatTokens(model.contextWindow) }))} bestSlugs={contextBest} />
                  <MetricRow label="Maximum output" values={models.map((model) => ({ slug: model.slug, value: formatTokens(model.maxOutput) }))} bestSlugs={outputWindowBest} />
                  <MetricRow label="Active providers" values={models.map((model) => ({ slug: model.slug, value: String(model.providerCount) }))} bestSlugs={[]} />
                  <MetricRow label="Weights" values={models.map((model) => ({ slug: model.slug, value: model.openWeights ? "Open weights" : "Closed weights" }))} bestSlugs={[]} />
                  <tr className="border-t border-white/[.07]">
                    <th scope="row" className="px-4 py-4 text-left text-[11px] font-semibold text-slate-400">Capabilities</th>
                    {models.map((model) => <td key={model.slug} className="px-4 py-4"><div className="flex max-w-64 flex-wrap gap-1">{model.capabilities.length ? model.capabilities.map((capability) => <span key={capability} className="pill">{capability.toLowerCase().replaceAll("_", " ")}</span>) : <span className="text-xs text-slate-600">Not listed</span>}</div></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <section className="mt-10" aria-labelledby="benchmark-comparison-title">
            <div className="mb-4">
              <div className="eyebrow">Evaluation signals</div>
              <h2 id="benchmark-comparison-title" className="mt-2 text-xl font-semibold text-white">Benchmark comparison</h2>
              <p className="mt-1 text-xs text-slate-500">Only benchmarks with at least one score among the selected models are shown. Leaders follow each benchmark&apos;s preferred direction.</p>
            </div>
            <div className="mb-4 rounded-lg border border-amber-200/15 bg-amber-200/[.04] px-4 py-3 text-[11px] leading-5 text-amber-100/80">
              Some seeded benchmark scores may be illustrative demo data, not independently verified published results. Review provenance on each model detail page.
            </div>
            {query.data.benchmarks.length === 0 ? (
              <div className="panel p-6 text-sm text-slate-500">No shared benchmark records are available for this selection.</div>
            ) : (
              <div className="space-y-3">
                {query.data.benchmarks.map((row) => (
                  <article key={row.benchmark.slug} className="panel p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div><div className="eyebrow">{row.benchmark.category.toLowerCase()}</div><h3 className="mt-1 text-sm font-semibold text-white">{row.benchmark.name}</h3></div>
                      <span className="pill">{row.benchmark.higherIsBetter ? "Higher is better" : "Lower is better"}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {models.map((model) => {
                        const score = row.scores[model.slug];
                        const isBest = row.bestModelSlug === model.slug;
                        return (
                          <div key={model.slug} className={`rounded-lg border p-3 ${isBest ? "border-emerald-300/25 bg-emerald-300/[.06]" : "border-white/[.06] bg-black/10"}`}>
                            <div className="truncate text-[10px] text-slate-500">{model.name}</div>
                            <div className={`mt-2 flex items-center gap-1.5 text-lg font-semibold tabular-nums ${isBest ? "text-emerald-100" : "text-slate-200"}`}>
                              {score === null || score === undefined ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(score)}
                              {score !== null && score !== undefined ? <span className="text-[10px] font-normal text-slate-500">{row.benchmark.unit}</span> : null}
                              {isBest ? <Check size={13} className="text-emerald-300" /> : null}
                            </div>
                            {score === null || score === undefined ? <p className="mt-1 text-[9px] text-slate-600">No score reported</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
