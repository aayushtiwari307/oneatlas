import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, Layers3 } from "lucide-react";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { groupModelsByReleaseYear } from "@/features/catalog/release-timeline";
import type { LabDetailDTO, ModelSummaryDTO } from "@/types/api";

function formatCompact(value: number | null): string {
  if (value === null) return "Not listed";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function ModelReleaseCard({ model }: { model: ModelSummaryDTO }) {
  return (
    <article className="panel min-w-0 p-4 transition hover:border-cyan-200/25">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/models/${encodeURIComponent(model.slug)}`} className="font-semibold text-slate-100 hover:text-cyan-200">
            {model.name}
          </Link>
          <div className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-500">{model.type.toLowerCase().replaceAll("_", " ")}</div>
        </div>
        <AddToCompareButton compact model={model} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="pill">{formatCompact(model.contextWindow)} context</span>
        <span className="pill">{model.providerCount} providers</span>
        {model.openWeights ? <span className="pill pill-cyan">Open weights</span> : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="truncate text-[10px] text-slate-500">
          {model.inputModalities.join(" · ").toLowerCase().replaceAll("_", " ") || "Modalities not listed"}
        </span>
        <Link href={`/models/${encodeURIComponent(model.slug)}`} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-cyan-200 hover:text-white">
          Details <ArrowUpRight size={11} />
        </Link>
      </div>
    </article>
  );
}

export function LabDetail({ lab }: { lab: LabDetailDTO }) {
  const releaseGroups = groupModelsByReleaseYear(lab.models);

  return (
    <div className="shell-width py-10 sm:py-14">
      <Link href="/labs" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-cyan-200">
        <ArrowLeft size={13} /> All labs
      </Link>

      <section className="panel mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="eyebrow">AI research lab</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">{lab.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              {lab.description || `Browse the models and releases associated with ${lab.name}.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="pill">{lab.country || "Country not listed"}</span>
              <span className="pill"><Layers3 size={11} className="mr-1.5" /> {lab.modelCount} models</span>
            </div>
          </div>
          {lab.website ? (
            <a href={lab.website} target="_blank" rel="noreferrer" className="control-button shrink-0">
              Official website <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="lab-release-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow">Catalogue history</div>
            <h2 id="lab-release-title" className="mt-2 text-xl font-semibold text-white sm:text-2xl">Model releases</h2>
            <p className="mt-1 text-xs text-slate-500">Newest releases first. Dates not supplied by the catalogue are grouped at the end.</p>
          </div>
          <span className="pill"><CalendarDays size={11} className="mr-1.5" /> {lab.models.length} listed</span>
        </div>

        {releaseGroups.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-sm font-semibold text-slate-300">No models listed for this lab yet</p>
            <p className="mt-1 text-xs text-slate-500">Models will appear here when they are included in the catalogue.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {releaseGroups.map((group) => (
              <section key={group.year} aria-labelledby={`release-${group.year.replaceAll(" ", "-")}`}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 id={`release-${group.year.replaceAll(" ", "-")}`} className="text-sm font-semibold text-cyan-100">{group.year}</h3>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[10px] text-slate-600">{group.models.length} {group.models.length === 1 ? "model" : "models"}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.models.map((model) => <ModelReleaseCard key={model.slug} model={model} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
