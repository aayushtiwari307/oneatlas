import Link from "next/link";
import { ArrowUpRight, Network } from "lucide-react";
import { SearchPalette } from "@/components/search/search-palette";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell-width flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="OneAtlas home">
          <span className="brand-mark" aria-hidden="true">
            <Network size={19} strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.04em] text-white">
            oneatlas<span className="text-cyan-300">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          <Link className="nav-link" href="/models">Models</Link>
          <Link className="nav-link" href="/rankings">Rankings</Link>
          <Link className="nav-link" href="/labs">Labs</Link>
          <Link className="nav-link" href="/providers">Providers</Link>
          <Link className="nav-link" href="/#data">Data & methodology</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <SearchPalette />
          <Link href="/models" className="header-cta hidden sm:inline-flex">
            Explore <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
