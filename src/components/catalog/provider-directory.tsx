import Link from "next/link";
import { ArrowUpRight, ExternalLink, Globe2, Network } from "lucide-react";
import type { ProviderSummaryDTO } from "@/types/api";

export function ProviderDirectory({ providers }: { providers: ProviderSummaryDTO[] }) {
  return (
    <div className="shell-width py-12 sm:py-16">
      <div className="max-w-3xl">
        <div className="eyebrow">Inference ecosystem</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">AI providers</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Browse inference providers and the models they currently serve. Provider availability
          and counts are based on active model offerings in the catalogue.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="pill"><Network size={11} className="mr-1.5" /> {providers.length} {providers.length === 1 ? "provider" : "providers"}</span>
        <span>Open a provider to compare its model-specific prices.</span>
      </div>

      {providers.length === 0 ? (
        <div className="panel mt-8 p-10 text-center">
          <Network className="mx-auto text-slate-600" size={24} />
          <h2 className="mt-3 text-sm font-semibold text-slate-200">No providers in the catalogue yet</h2>
          <p className="mt-1 text-xs text-slate-500">Provider offerings will appear here after the database has been seeded.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <article key={provider.slug} className="model-card flex min-w-0 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.07] text-base font-semibold text-cyan-100">
                  {(provider.name.trim().charAt(0) || "P").toUpperCase()}
                </div>
                <span className="pill">{provider.modelCount} active models</span>
              </div>
              <h2 className="mt-5 text-base font-semibold text-white">
                <Link href={`/providers/${encodeURIComponent(provider.slug)}`} className="hover:text-cyan-200">
                  {provider.name}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-3 min-h-[60px] text-xs leading-5 text-slate-400">
                {provider.description || "Explore available model offerings and pricing from this provider."}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Globe2 size={11} /> {provider.region || "Region not listed"}
                </span>
                <div className="flex items-center gap-3">
                  {provider.website ? (
                    <a href={provider.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-200" aria-label={`Visit ${provider.name} website`}>
                      Website <ExternalLink size={10} />
                    </a>
                  ) : null}
                  <Link href={`/providers/${encodeURIComponent(provider.slug)}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-200 hover:text-white">
                    Explore <ArrowUpRight size={11} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
