import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function ModelNotFound() {
  return (
    <div className="shell-width py-24">
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.06] text-cyan-200">
          <Search size={20} />
        </div>
        <p className="eyebrow mt-5">404 · Model not found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">This model isn&apos;t in the catalogue.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">The model may have been removed, or the address may be incorrect.</p>
        <Link href="/models" className="header-cta mt-6">
          <ArrowLeft size={13} /> Back to model explorer
        </Link>
      </div>
    </div>
  );
}
