import Link from "next/link";
import { ArrowUpRight, Building2, Cpu, ExternalLink } from "lucide-react";
import type { LabSummaryDTO } from "@/types/api";

export function LabDirectory({ labs }: { labs: LabSummaryDTO[] }) {
  return (
    <div className="shell-width py-12 sm:py-16">
      <div className="max-w-3xl">
        <div className="eyebrow">Research ecosystem</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">AI labs</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Explore the research organizations behind the models in the OneAtlas catalogue.
          Lab profiles and model counts are loaded from the catalogue database.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        <span className="pill"><Building2 size={11} className="mr-1.5" /> {labs.length} {labs.length === 1 ? "lab" : "labs"}</span>
        <span>Open a lab to browse its model release timeline.</span>
      </div>

      {labs.length === 0 ? (
        <div className="panel mt-8 p-10 text-center">
          <Building2 className="mx-auto text-slate-600" size={24} />
          <h2 className="mt-3 text-sm font-semibold text-slate-200">No labs in the catalogue yet</h2>
          <p className="mt-1 text-xs text-slate-500">Labs will appear here after the database has been seeded.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {labs.map((lab) => (
            <article key={lab.slug} className="model-card flex min-w-0 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.07] text-base font-semibold text-cyan-100">
                  {(lab.name.trim().charAt(0) || "L").toUpperCase()}
                </div>
                <span className="pill"><Cpu size={11} className="mr-1.5" /> {lab.modelCount} models</span>
              </div>
              <h2 className="mt-5 text-base font-semibold text-white">
                <Link href={`/labs/${encodeURIComponent(lab.slug)}`} className="hover:text-cyan-200">
                  {lab.name}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-3 min-h-[60px] text-xs leading-5 text-slate-400">
                {lab.description || "Explore models and releases from this research lab."}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                <span className="text-[10px] text-slate-500">{lab.country || "Country not listed"}</span>
                <div className="flex items-center gap-3">
                  {lab.website ? (
                    <a href={lab.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-200" aria-label={`Visit ${lab.name} website`}>
                      Website <ExternalLink size={10} />
                    </a>
                  ) : null}
                  <Link href={`/labs/${encodeURIComponent(lab.slug)}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-200 hover:text-white">
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
