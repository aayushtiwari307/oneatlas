import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  ExternalLink,
  Layers3,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ModelDetailDTO, ModelSummaryDTO } from "@/types/api";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { CostCalculator } from "@/components/models/cost-calculator";
import { getCheapestProviderSlugs } from "@/features/models/cheapest-provider";
import { getBenchmarkScoreBarWidth } from "@/features/models/benchmark-display";

type ModelDetailProps = {
  model: ModelDetailDTO;
  similarModels: ModelSummaryDTO[];
};

function formatCompact(value: number | null): string {
  if (value === null) return "Not listed";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPrice(value: number | null): string {
  if (value === null) return "Not listed";
  const fractionDigits = value > 0 && value < 0.01 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not listed";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatLabel(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

function ScoreSource({ source }: { source: string | null }) {
  if (!source) return <span className="text-[10px] text-slate-600">Source not provided</span>;
  if (source.toLowerCase() === "illustrative") {
    return <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.1em] text-amber-200">Illustrative score</span>;
  }
  if (/^https?:\/\//i.test(source)) {
    return (
      <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-cyan-200 hover:text-white">
        Source <ExternalLink size={10} />
      </a>
    );
  }
  return <span className="text-[10px] text-slate-500">Source: {source}</span>;
}

function SpecCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="panel min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[.13em]">{label}</span>
      </div>
      <div className="mt-3 truncate text-lg font-semibold tracking-tight text-slate-100">{value}</div>
      {detail ? <div className="mt-1 text-[10px] text-slate-500">{detail}</div> : null}
    </div>
  );
}

function BenchmarkScoreCard({ score }: { score: ModelDetailDTO["scores"][number] }) {
  const barWidth = getBenchmarkScoreBarWidth(score.score, score.benchmark.unit);
  const measuredDate = formatDate(score.measuredAt);

  return (
    <article className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">{score.benchmark.category.toLowerCase()}</div>
          <h3 className="mt-1 text-sm font-semibold text-slate-100">{score.benchmark.name}</h3>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold tabular-nums tracking-tight text-white">
            {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(score.score)}
            <span className="ml-1 text-[10px] font-medium text-slate-500">{score.benchmark.unit}</span>
          </div>
          <div className="mt-1 text-[9px] text-slate-600">{score.benchmark.higherIsBetter ? "Higher is better" : "Lower is better"}</div>
        </div>
      </div>
      {barWidth !== null ? (
        <div className="mt-4">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
            role="meter"
            aria-label={`${score.benchmark.name} percentage score`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={barWidth}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300" style={{ width: `${barWidth}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-slate-500">
          Raw metric. No percentage scale is implied.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <ScoreSource source={score.source} />
        {score.measuredAt ? <span className="text-[9px] text-slate-600">Measured {measuredDate}</span> : null}
      </div>
    </article>
  );
}

function OfferingTable({ model }: { model: ModelDetailDTO }) {
  const cheapestProviderSlugs = new Set(getCheapestProviderSlugs(model.offerings));

  return (
    <section className="mt-12" aria-labelledby="provider-pricing-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Inference ecosystem</div>
          <h2 id="provider-pricing-title" className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Provider pricing</h2>
          <p className="mt-1 text-xs text-slate-500">USD per 1 million tokens. Only active provider offerings are shown.</p>
        </div>
        <span className="pill">{model.offerings.length} active {model.offerings.length === 1 ? "offering" : "offerings"}</span>
      </div>

      {model.offerings.length === 0 ? (
        <div className="panel p-7 text-center">
          <CircleDollarSign className="mx-auto text-slate-600" size={22} />
          <p className="mt-3 text-sm font-medium text-slate-300">No active provider pricing available</p>
          <p className="mt-1 text-xs text-slate-500">Provider offerings will appear here when they are available in the catalogue.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1524]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[.13em] text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Input / 1M</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Output / 1M</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Cached input / 1M</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Context</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Max output</th>
                </tr>
              </thead>
              <tbody>
                {model.offerings.map((offering) => {
                  const isCheapest = cheapestProviderSlugs.has(offering.provider.slug);
                  return (
                    <tr className="border-t border-white/[0.06] transition hover:bg-white/[0.025]" key={offering.provider.slug}>
                      <td className="px-4 py-4">
                        <Link href={`/providers/${encodeURIComponent(offering.provider.slug)}`} className="font-semibold text-slate-200 hover:text-cyan-200">
                          {offering.provider.name}
                        </Link>
                        {isCheapest ? <span className="ml-2 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2 py-0.5 text-[9px] font-semibold text-emerald-200">Cheapest input</span> : null}
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-slate-200">{formatPrice(offering.inputPricePer1M)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-300">{formatPrice(offering.outputPricePer1M)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-400">{formatPrice(offering.cachedInputPricePer1M)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-400">{formatCompact(offering.contextWindow)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-400">{formatCompact(offering.maxOutput)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3 text-[10px] text-slate-600">
            Latency and throughput are not included in this table when provider measurements are unavailable; the API retains those fields for future presentation.
          </div>
        </div>
      )}
    </section>
  );
}

function SimilarModels({ models }: { models: ModelSummaryDTO[] }) {
  return (
    <section className="mt-12 pb-16" aria-labelledby="similar-models-title">
      <div className="mb-5">
        <div className="eyebrow">Continue exploring</div>
        <h2 id="similar-models-title" className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Related models</h2>
        <p className="mt-1 text-xs text-slate-500">Related by AI lab or shared capabilities.</p>
      </div>
      {models.length === 0 ? (
        <div className="panel p-6 text-sm text-slate-500">No related models are available in the current catalogue.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {models.map((model) => (
            <Link href={`/models/${encodeURIComponent(model.slug)}`} key={model.id} className="model-card group block p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="eyebrow truncate">{model.lab.name}</span>
                <ArrowUpRight size={14} className="shrink-0 text-slate-600 transition group-hover:text-cyan-200" />
              </div>
              <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-slate-100 group-hover:text-cyan-100">{model.name}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="pill">{model.type}</span>
                {model.openWeights ? <span className="pill">Open weights</span> : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
                <span>{formatCompact(model.contextWindow)} context</span>
                <span className="inline-flex items-center gap-1 text-cyan-200">Explore <ArrowRight size={11} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function ModelDetail({ model, similarModels }: ModelDetailProps) {
  const illustrativeScores = model.scores.some((score) => score.source?.toLowerCase() === "illustrative");

  return (
    <div className="shell-width">
      <div className="pt-8 sm:pt-10">
        <Link href="/models" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-cyan-200">
          <ArrowLeft size={13} /> Back to model explorer
        </Link>
      </div>

      <header className="relative mt-7 overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#122239] via-[#0d1728] to-[#0b1220] p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{model.lab.name}</span>
            <span className="pill">{model.type}</span>
            {model.openWeights ? <span className="pill pill-cyan">Open weights</span> : null}
          </div>
          <h1 className="mt-4 max-w-4xl break-words text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl lg:text-5xl">{model.name}</h1>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-400 sm:text-sm">
            {model.description ?? "Explore specifications, active provider pricing and available benchmark measurements for this model."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
            <Link href={`/labs/${encodeURIComponent(model.lab.slug)}`} className="inline-flex items-center gap-1.5 transition hover:text-cyan-200">
              <Layers3 size={12} /> {model.lab.name} <ArrowUpRight size={10} />
            </Link>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Released {formatDate(model.releaseDate)}</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={12} /> {model.providerCount} active providers</span>
            <AddToCompareButton model={model} compact />
          </div>
        </div>
      </header>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Model key specifications">
        <SpecCard icon={<Cpu size={13} />} label="Context window" value={formatCompact(model.contextWindow)} detail="Tokens" />
        <SpecCard icon={<Sparkles size={13} />} label="Maximum output" value={formatCompact(model.maxOutput)} detail="Tokens" />
        <SpecCard icon={<CircleDollarSign size={13} />} label="Input price from" value={formatPrice(model.minInputPrice)} detail="USD / 1M tokens" />
        <SpecCard icon={<CheckCircle2 size={13} />} label="Active providers" value={String(model.providerCount)} detail="Available offerings" />
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="panel p-5 sm:p-6">
          <div className="eyebrow">Input and output</div>
          <h2 className="mt-2 text-base font-semibold text-white">Supported modalities</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-500">Input</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {model.inputModalities.length > 0 ? model.inputModalities.map((value) => <span className="pill pill-cyan" key={value}>{formatLabel(value)}</span>) : <span className="text-xs text-slate-600">Not listed</span>}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-500">Output</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {model.outputModalities.length > 0 ? model.outputModalities.map((value) => <span className="pill pill-cyan" key={value}>{formatLabel(value)}</span>) : <span className="text-xs text-slate-600">Not listed</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="panel p-5 sm:p-6">
          <div className="eyebrow">Model capabilities</div>
          <h2 className="mt-2 text-base font-semibold text-white">What it supports</h2>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {model.capabilities.length > 0 ? model.capabilities.map((value) => <span className="pill" key={value}>{formatLabel(value)}</span>) : <span className="text-xs text-slate-600">No capabilities listed</span>}
          </div>
        </div>
      </section>

      <OfferingTable model={model} />
      <CostCalculator offerings={model.offerings} />

      <section className="mt-12" aria-labelledby="benchmark-scores-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow">Evaluation signals</div>
            <h2 id="benchmark-scores-title" className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Benchmarks</h2>
            <p className="mt-1 text-xs text-slate-500">Scores are shown with their supplied units and provenance.</p>
          </div>
          <span className="pill">{model.scores.length} recorded {model.scores.length === 1 ? "score" : "scores"}</span>
        </div>

        {illustrativeScores ? (
          <div className="mb-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.045] px-4 py-3 text-[11px] leading-5 text-amber-100/80">
            Some benchmark values on this page are illustrative demo data, not published leaderboard results. Check each score&apos;s provenance before relying on it.
          </div>
        ) : null}

        {model.scores.length === 0 ? (
          <div className="panel p-7 text-center">
            <Scale className="mx-auto text-slate-600" size={22} />
            <p className="mt-3 text-sm font-medium text-slate-300">No benchmark scores recorded</p>
            <p className="mt-1 text-xs text-slate-500">Benchmark results will appear here when score records are available.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {model.scores.map((score) => <BenchmarkScoreCard score={score} key={score.benchmark.slug} />)}
          </div>
        )}
      </section>

      <SimilarModels models={similarModels} />
    </div>
  );
}
