"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  LoaderCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { FiltersDTO, ModelSummaryDTO, PageMeta } from "@/types/api";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { buildModelsRequest, type ModelExplorerQueryState } from "@/features/explorer/models-query";

const explorerParsers = {
  q: parseAsString.withDefault(""),
  lab: parseAsString.withDefault(""),
  provider: parseAsString.withDefault(""),
  capability: parseAsString.withDefault(""),
  modality: parseAsString.withDefault(""),
  type: parseAsString.withDefault(""),
  minContext: parseAsString.withDefault(""),
  maxPrice: parseAsString.withDefault(""),
  sort: parseAsString.withDefault("release"),
  order: parseAsString.withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  view: parseAsString.withDefault("grid"),
};

type ModelsResponse = { data: ModelSummaryDTO[]; meta: PageMeta };
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


type DebouncedSearchInputProps = {
  initialValue: string;
  onCommit: (value: string) => void;
};

/** Keeps local typing state aligned with URL changes without remounting the input. */
function DebouncedSearchInput({ initialValue, onCommit }: DebouncedSearchInputProps) {
  const [draft, setDraft] = useState(initialValue);
  const [previousInitialValue, setPreviousInitialValue] = useState(initialValue);

  // Synchronize externally changed URL state during render, but preserve a newer
  // local draft when the URL is catching up with a debounced keystroke.
  if (initialValue !== previousInitialValue) {
    setPreviousInitialValue(initialValue);
    if (draft === previousInitialValue) setDraft(initialValue);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextValue = draft.trim();
      if (nextValue !== initialValue) onCommit(nextValue);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, initialValue, onCommit]);

  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">Search models</span>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        className="field-control h-12 pl-11 pr-4 text-sm"
        type="search"
        placeholder="Search models, labs or model names…"
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
      />
    </label>
  );
}

function splitCsv(value: string): string[] {
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function joinCsv(values: string[]): string {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right)).join(",");
}

function toggleCsv(value: string, item: string): string {
  const values = new Set(splitCsv(value));
  if (values.has(item)) values.delete(item);
  else values.add(item);
  return joinCsv([...values]);
}

function formatTokens(value: number | null): string {
  return value === null ? "—" : `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)} tokens`;
}

function formatUsd(value: number | null): string {
  if (value === null) return "Not listed";
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value);
}

function sortValue(state: Pick<ModelExplorerQueryState, "sort" | "order">): string {
  return `${state.sort}:${state.order}`;
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Loading models">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="panel p-5" key={index}>
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-6 w-2/3" />
          <div className="skeleton mt-3 h-3 w-1/3" />
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="skeleton h-12" />
            <div className="skeleton h-12" />
          </div>
          <div className="skeleton mt-6 h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

function FilterOptions({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: Array<{ value: string; count: number }>;
  selected: string;
  onToggle: (value: string) => void;
}) {
  const checked = splitCsv(selected);
  if (values.length === 0) return null;
  return (
    <fieldset className="border-t border-white/[0.07] pt-4">
      <legend className="field-label">{title}</legend>
      <div className="mt-2 space-y-2">
        {values.map((item) => (
          <label key={item.value} className="filter-option cursor-pointer">
            <input
              className="filter-check"
              type="checkbox"
              checked={checked.includes(item.value)}
              onChange={() => onToggle(item.value)}
            />
            <span className="min-w-0 flex-1 truncate">{item.value.replaceAll("_", " ").toLowerCase()}</span>
            <span className="text-[10px] tabular-nums text-slate-600">{item.count}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FilterPanel({
  filters,
  state,
  onChange,
  onClear,
  compact = false,
}: {
  filters: FiltersDTO | undefined;
  state: ModelExplorerQueryState;
  onChange: (patch: Partial<ModelExplorerQueryState>) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "p-5" : "p-4"}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <SlidersHorizontal size={14} className="text-cyan-200" /> Filters
        </div>
        <button type="button" onClick={onClear} className="text-[10px] font-semibold text-slate-500 transition hover:text-cyan-200">
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor={compact ? "lab-mobile" : "lab-desktop"}>AI lab</label>
          <select
            id={compact ? "lab-mobile" : "lab-desktop"}
            className="field-control"
            value={state.lab}
            onChange={(event) => onChange({ lab: event.target.value, page: 1 })}
          >
            <option value="">All labs</option>
            {filters?.labs.map((lab) => <option value={lab.slug} key={lab.slug}>{lab.name} ({lab.count})</option>)}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor={compact ? "provider-mobile" : "provider-desktop"}>Inference provider</label>
          <select
            id={compact ? "provider-mobile" : "provider-desktop"}
            className="field-control"
            value={state.provider}
            onChange={(event) => onChange({ provider: event.target.value, page: 1 })}
          >
            <option value="">All providers</option>
            {filters?.providers.map((provider) => <option value={provider.slug} key={provider.slug}>{provider.name} ({provider.count})</option>)}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor={compact ? "type-mobile" : "type-desktop"}>Model type</label>
          <select
            id={compact ? "type-mobile" : "type-desktop"}
            className="field-control"
            value={state.type}
            onChange={(event) => onChange({ type: event.target.value, page: 1 })}
          >
            <option value="">All types</option>
            {filters?.types.map((type) => <option value={type.value} key={type.value}>{type.value} ({type.count})</option>)}
          </select>
        </div>

        <FilterOptions
          title="Capabilities"
          values={filters?.capabilities ?? []}
          selected={state.capability}
          onToggle={(value) => onChange({ capability: toggleCsv(state.capability, value), page: 1 })}
        />
        <FilterOptions
          title="Input modalities"
          values={filters?.modalities ?? []}
          selected={state.modality}
          onToggle={(value) => onChange({ modality: toggleCsv(state.modality, value), page: 1 })}
        />

        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4">
          <div>
            <label className="field-label" htmlFor={compact ? "context-mobile" : "context-desktop"}>Min context</label>
            <input
              id={compact ? "context-mobile" : "context-desktop"}
              className="field-control"
              inputMode="numeric"
              type="number"
              min="0"
              placeholder={filters?.contextRange.min?.toLocaleString("en-US") ?? "Tokens"}
              value={state.minContext}
              onChange={(event) => onChange({ minContext: event.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor={compact ? "price-mobile" : "price-desktop"}>Max input price</label>
            <input
              id={compact ? "price-mobile" : "price-desktop"}
              className="field-control"
              inputMode="decimal"
              type="number"
              min="0"
              step="any"
              placeholder="USD / 1M"
              value={state.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value, page: 1 })}
            />
          </div>
        </div>
        <p className="text-[10px] leading-5 text-slate-600">
          Price filters use the cheapest active provider input price per 1M tokens. Counts are global, not faceted.
        </p>
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: ModelSummaryDTO }) {
  return (
    <article className="model-card group p-5">
      <Link href={`/models/${encodeURIComponent(model.slug)}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow truncate">{model.lab.name}</div>
            <h2 className="mt-2 truncate text-base font-semibold tracking-tight text-white group-hover:text-cyan-100">{model.name}</h2>
            <p className="mt-1 truncate text-[11px] text-slate-500">{model.slug}</p>
          </div>
          <span className="pill shrink-0">{model.type}</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">Context window</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{formatTokens(model.contextWindow)}</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">Input / 1M</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-slate-200">{formatUsd(model.minInputPrice)}</div>
          </div>
        </div>
        <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
          {model.capabilities.slice(0, 3).map((capability) => <span className="pill pill-cyan" key={capability}>{capability.toLowerCase().replaceAll("_", " ")}</span>)}
          {model.openWeights ? <span className="pill">Open weights</span> : null}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[10px] text-slate-500">
          <span>{model.providerCount} active {model.providerCount === 1 ? "provider" : "providers"}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-cyan-200 opacity-70 transition group-hover:opacity-100">View model <ArrowRight size={12} /></span>
        </div>
      </Link>
      <div className="mt-3 flex justify-end">
        <AddToCompareButton model={model} compact />
      </div>
    </article>
  );
}

function ModelTable({ models }: { models: ModelSummaryDTO[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1524]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs">
          <thead className="bg-white/[0.025] text-[10px] uppercase tracking-[.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Context</th>
              <th className="px-4 py-3 font-semibold">Input / 1M</th>
              <th className="px-4 py-3 font-semibold">Providers</th>
              <th className="px-4 py-3 font-semibold">Compare</th>
              <th className="px-4 py-3 font-semibold"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr className="border-t border-white/[0.06] transition hover:bg-white/[0.025]" key={model.id}>
                <td className="px-4 py-4">
                  <Link href={`/models/${encodeURIComponent(model.slug)}`} className="font-semibold text-slate-200 hover:text-cyan-200">{model.name}</Link>
                  <div className="mt-1 text-[10px] text-slate-500">{model.lab.name}</div>
                </td>
                <td className="px-4 py-4 text-slate-400">{model.type}</td>
                <td className="px-4 py-4 tabular-nums text-slate-300">{formatTokens(model.contextWindow)}</td>
                <td className="px-4 py-4 tabular-nums text-slate-300">{formatUsd(model.minInputPrice)}</td>
                <td className="px-4 py-4 text-slate-400">{model.providerCount}</td>
                <td className="px-4 py-4"><AddToCompareButton model={model} compact /></td>
                <td className="px-4 py-4 text-right"><ArrowRight size={14} className="inline text-slate-500" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModelExplorer() {
  const [queryState, setQueryState] = useQueryStates(explorerParsers, { history: "replace" });
  const filterDialogRef = useRef<HTMLDialogElement>(null);
  const commitSearch = useCallback((value: string) => {
    void setQueryState({ q: value || null, page: 1 });
  }, [setQueryState]);

  const explorerState: ModelExplorerQueryState = useMemo(() => ({
    q: queryState.q,
    lab: queryState.lab,
    provider: queryState.provider,
    capability: queryState.capability,
    modality: queryState.modality,
    type: queryState.type,
    minContext: queryState.minContext,
    maxPrice: queryState.maxPrice,
    sort: queryState.sort,
    order: queryState.order,
    page: queryState.page,
    limit: 24,
  }), [queryState]);

  const request = buildModelsRequest(explorerState);
  const modelsQuery = useQuery({
    queryKey: ["models", request],
    queryFn: () => readApi<ModelsResponse>(`/api/models?${request}`),
    placeholderData: (previousData) => previousData,
  });
  const filtersQuery = useQuery({
    queryKey: ["model-filters"],
    queryFn: () => readApi<ApiEnvelope<FiltersDTO>>("/api/filters").then((payload) => payload.data),
    staleTime: 5 * 60_000,
  });

  const data = modelsQuery.data;
  const models = data?.data ?? [];
  const meta = data?.meta;
  const selectedCapabilityCount = splitCsv(queryState.capability).length;
  const selectedModalityCount = splitCsv(queryState.modality).length;
  const activeFilterCount = [queryState.lab, queryState.provider, queryState.type, queryState.minContext, queryState.maxPrice].filter(Boolean).length + selectedCapabilityCount + selectedModalityCount;

  function updateState(patch: Partial<ModelExplorerQueryState>) {
    const next: {
      q?: string | null;
      lab?: string | null;
      provider?: string | null;
      capability?: string | null;
      modality?: string | null;
      type?: string | null;
      minContext?: string | null;
      maxPrice?: string | null;
      sort?: string | null;
      order?: string | null;
      page?: number;
    } = { page: 1 };

    if (patch.q !== undefined) next.q = patch.q || null;
    if (patch.lab !== undefined) next.lab = patch.lab || null;
    if (patch.provider !== undefined) next.provider = patch.provider || null;
    if (patch.capability !== undefined) next.capability = patch.capability || null;
    if (patch.modality !== undefined) next.modality = patch.modality || null;
    if (patch.type !== undefined) next.type = patch.type || null;
    if (patch.minContext !== undefined) next.minContext = patch.minContext || null;
    if (patch.maxPrice !== undefined) next.maxPrice = patch.maxPrice || null;
    if (patch.sort !== undefined) next.sort = patch.sort || null;
    if (patch.order !== undefined) next.order = patch.order || null;
    if (patch.page !== undefined) next.page = Math.max(1, patch.page);

    void setQueryState(next);
  }

  function clearFilters() {
    void setQueryState({ q: null, lab: null, provider: null, capability: null, modality: null, type: null, minContext: null, maxPrice: null, sort: "release", order: "desc", page: 1, view: "grid" });
  }

  function closeFilterDialog() {
    filterDialogRef.current?.close();
  }

  const panelProps = {
    filters: filtersQuery.data,
    state: explorerState,
    onChange: updateState,
    onClear: clearFilters,
  };

  return (
    <div className="shell-width pb-16 pt-10 sm:pt-14">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Model intelligence</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white sm:text-4xl">Explore AI models</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Search the catalogue, narrow by real model metadata and inspect active provider pricing.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-md border border-white/10 px-2.5 py-1.5">PostgreSQL search</span>
          <span className="rounded-md border border-white/10 px-2.5 py-1.5">Live API</span>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <DebouncedSearchInput
          initialValue={queryState.q}
          onCommit={commitSearch}
        />
        <button type="button" className="control-button lg:hidden" onClick={() => filterDialogRef.current?.showModal()}>
          <Filter size={14} /> Filters {activeFilterCount > 0 ? <span className="rounded-full bg-cyan-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">{activeFilterCount}</span> : null}
        </button>
        <label className="flex min-w-[190px] items-center gap-2 rounded-lg border border-white/10 bg-[#0d1524] px-3">
          <span className="shrink-0 text-[10px] font-semibold text-slate-500">Sort by</span>
          <select
            className="h-11 min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none"
            value={sortValue(explorerState)}
            onChange={(event) => {
              const [sort, order] = event.target.value.split(":");
              updateState({ sort, order });
            }}
          >
            <option value="release:desc">Newest first</option>
            <option value="price:asc">Lowest input price</option>
            <option value="context:desc">Largest context</option>
            <option value="name:asc">Name A–Z</option>
          </select>
          <ChevronDown size={13} className="pointer-events-none text-slate-500" />
        </label>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="panel sticky top-[90px] hidden max-h-[calc(100vh-110px)] overflow-y-auto lg:block" aria-label="Model filters">
          <FilterPanel {...panelProps} />
        </aside>

        <dialog ref={filterDialogRef} className="filter-dialog lg:hidden" aria-label="Filter models">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <span className="text-sm font-semibold text-white">Filter catalogue</span>
            <button type="button" onClick={closeFilterDialog} className="control-button !min-h-8 !px-2" aria-label="Close filters"><X size={14} /></button>
          </div>
          <div className="max-h-[calc(88vh-70px)] overflow-y-auto">
            <FilterPanel {...panelProps} compact />
            <div className="sticky bottom-0 border-t border-white/10 bg-[#0d1524] p-4">
              <button type="button" onClick={closeFilterDialog} className="w-full rounded-lg bg-cyan-100 px-4 py-3 text-xs font-bold text-slate-950">Show results</button>
            </div>
          </div>
        </dialog>

        <section className="min-w-0" aria-label="Model search results">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400" aria-live="polite">
              {modelsQuery.isPending ? "Loading catalogue…" : meta ? <><span className="font-semibold text-slate-100">{meta.total.toLocaleString("en-US")}</span> models found <span className="text-slate-600">· page {meta.page} of {meta.totalPages}</span></> : "Model catalogue"}
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0d1524] p-1">
              <button type="button" aria-label="Grid view" aria-pressed={queryState.view !== "table"} onClick={() => void setQueryState({ view: "grid" })} className={`rounded-md p-2 ${queryState.view !== "table" ? "bg-white/10 text-cyan-100" : "text-slate-500 hover:text-white"}`}><LayoutGrid size={14} /></button>
              <button type="button" aria-label="Table view" aria-pressed={queryState.view === "table"} onClick={() => void setQueryState({ view: "table" })} className={`rounded-md p-2 ${queryState.view === "table" ? "bg-white/10 text-cyan-100" : "text-slate-500 hover:text-white"}`}><List size={14} /></button>
            </div>
          </div>

          {filtersQuery.isError ? <p className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-xs text-amber-100">Filter metadata could not be loaded. Search results may still be available.</p> : null}
          {modelsQuery.isPending ? <SkeletonGrid /> : null}

          {modelsQuery.isError ? (
            <div className="panel flex flex-col items-center px-6 py-14 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-400/10 text-rose-200"><AlertCircle size={19} /></span>
              <h2 className="mt-4 text-base font-semibold text-white">Could not load the model catalogue</h2>
              <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">{modelsQuery.error.message}. Check that the database is configured and seeded, then try again.</p>
              <button type="button" onClick={() => void modelsQuery.refetch()} className="control-button mt-5"><RotateCcw size={13} /> Retry request</button>
            </div>
          ) : null}

          {modelsQuery.isSuccess && models.length === 0 ? (
            <div className="panel flex flex-col items-center px-6 py-16 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cyan-300/[0.08] text-cyan-200"><Search size={18} /></span>
              <h2 className="mt-4 text-base font-semibold text-white">No models match those filters</h2>
              <p className="mt-2 text-xs text-slate-400">Try a different search, or clear the active filters.</p>
              <button type="button" onClick={clearFilters} className="control-button mt-5"><RotateCcw size={13} /> Clear filters</button>
            </div>
          ) : null}

          {modelsQuery.isSuccess && models.length > 0 ? (
            queryState.view === "table" ? <ModelTable models={models} /> : <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{models.map((model) => <ModelCard model={model} key={model.id} />)}</div>
          ) : null}

          {meta && meta.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
              <button type="button" className="control-button" disabled={meta.page <= 1} onClick={() => updateState({ page: meta.page - 1 })}><ArrowLeft size={13} /> Previous</button>
              <span className="text-[11px] tabular-nums text-slate-500">Page {meta.page} / {meta.totalPages}</span>
              <button type="button" className="control-button" disabled={meta.page >= meta.totalPages} onClick={() => updateState({ page: meta.page + 1 })}>Next <ArrowRight size={13} /></button>
            </div>
          ) : null}

          {modelsQuery.isFetching && !modelsQuery.isPending ? <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-slate-600"><LoaderCircle size={12} className="animate-spin" /> Updating results</div> : null}
        </section>
      </div>
      <div className="mt-10 flex items-start gap-2 border-t border-white/[0.07] pt-5 text-[10px] leading-5 text-slate-600">
        <Check size={12} className="mt-0.5 shrink-0 text-cyan-300/70" />
        Filter controls are URL-backed, so a copied link preserves the current search, sort, filters, page and view.
      </div>
    </div>
  );
}
