import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="shell-width flex min-h-[55vh] items-center justify-center py-16">
      <div className="panel w-full max-w-lg p-8 text-center sm:p-10">
        <div className="mx-auto grid size-12 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-300/[0.07] text-cyan-100">
          <Search size={19} />
        </div>
        <p className="eyebrow mt-5">404 · Not found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">This page is not in the atlas</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">The item may have moved, or the URL may be incorrect.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/models" className="control-button control-button-active">Explore models</Link>
          <Link href="/" className="control-button"><ArrowLeft size={12} /> Home</Link>
        </div>
      </div>
    </div>
  );
}
