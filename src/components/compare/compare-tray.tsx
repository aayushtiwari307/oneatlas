"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useCompareSelection } from "@/features/compare/compare-selection-provider";

export function CompareTray() {
  const { selections, ready, remove, clear } = useCompareSelection();
  if (!ready || selections.length === 0) return null;

  const modelsQuery = encodeURIComponent(selections.map((item) => item.slug).join(","));

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-200/15 bg-[#091321]/95 shadow-[0_-16px_50px_rgba(0,0,0,.35)] backdrop-blur-xl"
      aria-label="Model comparison tray"
    >
      <div className="shell-width flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-200">Compare · {selections.length}/4</span>
          {selections.map((model) => (
            <span key={model.slug} className="inline-flex max-w-[190px] items-center gap-2 rounded-full border border-white/10 bg-white/[.04] py-1 pl-3 pr-1.5 text-[10px] text-slate-200">
              <span className="truncate">{model.name}</span>
              <button
                type="button"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-white/10 hover:text-white"
                onClick={() => remove(model.slug)}
                aria-label={`Remove ${model.name} from comparison`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={clear} className="px-2 py-2 text-[10px] font-semibold text-slate-500 hover:text-white">Clear</button>
          <Link href={`/compare?models=${modelsQuery}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-100 px-4 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-white">
            Compare models <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
