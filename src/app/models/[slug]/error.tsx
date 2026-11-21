"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ModelDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="shell-width py-20">
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-300" size={24} />
        <h1 className="mt-4 text-lg font-semibold text-white">Model details are temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">The catalogue could not be reached. Check the database connection and try again.</p>
        <button type="button" onClick={reset} className="control-button control-button-active mt-6">
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    </div>
  );
}
