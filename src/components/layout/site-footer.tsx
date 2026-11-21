import Link from "next/link";
import { Network } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="data">
      <div className="shell-width py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-200">
            <Network size={16} className="text-cyan-300" />
            oneatlas<span className="text-cyan-300">.</span>
          </div>
          <p className="max-w-2xl text-xs leading-6 text-slate-500">
            Data note: some catalogue specifications, provider associations, prices and benchmark
            values are illustrative. Treat them as demo data unless a record is backed by a cited
            source or a verified provider sync.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <Link href="/models" className="transition hover:text-cyan-200">Models</Link>
            <Link href="/rankings" className="transition hover:text-cyan-200">Rankings</Link>
            <Link href="/labs" className="transition hover:text-cyan-200">Labs</Link>
            <Link href="/providers" className="transition hover:text-cyan-200">Providers</Link>
          </div>
        </div>
        <div className="mt-6 border-t border-white/[0.07] pt-4 text-[11px] text-slate-600">
          © {new Date().getFullYear()} OneAtlas · AI model discovery and intelligence
        </div>
      </div>
    </footer>
  );
}
