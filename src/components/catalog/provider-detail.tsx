import Link from "next/link";
import { ArrowLeft, ExternalLink, Network } from "lucide-react";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import type { ProviderDetailDTO } from "@/types/api";

function formatPrice(value: number | null): string {
  if (value === null) return "Not listed";
  if (value === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 6 : 2,
  }).format(value);
}

function formatCompact(value: number | null): string {
  if (value === null) return "Not listed";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function ProviderDetail({ provider }: { provider: ProviderDetailDTO }) {
  return (
    <div className="shell-width py-10 sm:py-14">
      <Link href="/providers" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-cyan-200">
        <ArrowLeft size={13} /> All providers
      </Link>

      <section className="panel mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="eyebrow">Inference provider</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">{provider.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              {provider.description || `Explore active model offerings and pricing from ${provider.name}.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="pill">{provider.region || "Region not listed"}</span>
              <span className="pill"><Network size={11} className="mr-1.5" /> {provider.modelCount} active models</span>
            </div>
          </div>
          {provider.website ? (
            <a href={provider.website} target="_blank" rel="noreferrer" className="control-button shrink-0">
              Official website <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="provider-models-title">
        <div className="mb-5">
          <div className="eyebrow">Available models</div>
          <h2 id="provider-models-title" className="mt-2 text-xl font-semibold text-white sm:text-2xl">Models and pricing</h2>
          <p className="mt-1 text-xs text-slate-500">Prices below belong to this provider&apos;s active offering, in USD per 1 million tokens.</p>
        </div>

        {provider.models.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-sm font-semibold text-slate-300">No active model offerings</p>
            <p className="mt-1 text-xs text-slate-500">This provider has no active offerings in the current catalogue.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1524]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[.13em] text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Model</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Input / 1M</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Output / 1M</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Context</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Max output</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Compare</th>
                  </tr>
                </thead>
                <tbody>
                  {provider.models.map((model) => (
                    <tr key={model.slug} className="border-t border-white/[0.06] transition hover:bg-white/[0.025]">
                      <td className="px-4 py-4">
                        <Link href={`/models/${encodeURIComponent(model.slug)}`} className="font-semibold text-slate-100 hover:text-cyan-200">{model.name}</Link>
                        <div className="mt-1 text-[10px] text-slate-500">
                          <Link href={`/labs/${encodeURIComponent(model.lab.slug)}`} className="hover:text-cyan-200">{model.lab.name}</Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-slate-200">{formatPrice(model.offering.inputPricePer1M)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-300">{formatPrice(model.offering.outputPricePer1M)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-400">{formatCompact(model.offering.contextWindow ?? model.contextWindow)}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-400">{formatCompact(model.offering.maxOutput ?? model.maxOutput)}</td>
                      <td className="px-4 py-4"><AddToCompareButton compact model={model} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/[0.06] px-4 py-3 text-[10px] text-slate-600">
              The list is ordered by this provider&apos;s input price (lowest first), as returned by the catalogue API.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
