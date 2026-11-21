import Link from "next/link";
import { PricePerformanceChart } from "@/components/insights/price-performance-chart";
import { ArrowRight, Layers3, Search, SlidersHorizontal, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="shell-width">
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute -right-20 top-8 h-80 w-80 rounded-full bg-cyan-500/[0.09] blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-medium text-cyan-100">
            <Sparkles size={13} /> The AI model landscape, indexed
          </div>
          <h1 className="max-w-4xl text-5xl leading-[1.04] font-semibold tracking-[-0.065em] text-white sm:text-6xl lg:text-[76px]">
            Find the right model.
            <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Understand the trade-offs.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            OneAtlas gives developers a structured way to explore AI models across labs and
            inference providers — with capabilities, context windows, pricing and benchmarks in
            one place.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/models" className="inline-flex items-center gap-2 rounded-lg bg-cyan-100 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-white">
              <Search size={16} /> Explore models <ArrowRight size={15} />
            </Link>
            <a href="#platform" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white">
              How it works <ArrowRight size={15} />
            </a>
          </div>
          <div className="mt-16 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/[0.08] pt-6 text-[11px] uppercase tracking-[.13em] text-slate-500">
            <span>Discover</span><span>·</span><span>Filter</span><span>·</span><span>Compare</span><span>·</span><span>Evaluate</span>
          </div>
        </div>
      </section>

      <section id="platform" className="grid gap-4 border-t border-white/[0.08] py-16 md:grid-cols-3">
        <article className="panel p-6">
          <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200"><Search size={18} /></div>
          <h2 className="text-base font-semibold text-slate-100">Discover with intent</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Search a structured catalogue and narrow results by lab, provider, capability, modality, price and context length.</p>
        </article>
        <article className="panel p-6">
          <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-indigo-200/15 bg-indigo-200/[0.07] text-indigo-200"><SlidersHorizontal size={18} /></div>
          <h2 className="text-base font-semibold text-slate-100">See the trade-offs</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Understand the differences between model specifications, modalities, active provider offerings and benchmark results.</p>
        </article>
        <article className="panel p-6">
          <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-emerald-200/15 bg-emerald-200/[0.07] text-emerald-200"><Layers3 size={18} /></div>
          <h2 className="text-base font-semibold text-slate-100">Follow the ecosystem</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Explore models from AI labs and the inference providers that make them available.</p>
        </article>
      </section>

      <PricePerformanceChart />

      <section className="mb-16 rounded-2xl border border-cyan-200/15 bg-gradient-to-r from-cyan-300/[0.08] to-indigo-300/[0.04] p-7 sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="eyebrow">Model explorer</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start with the catalogue.</h2>
            <p className="mt-2 text-sm text-slate-400">Browse model specs and pricing from the live OneAtlas API.</p>
          </div>
          <Link href="/models" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-100 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-white">
            Open model explorer <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
