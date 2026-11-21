"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export function CatalogRouteError({
  kind,
  reset,
}: {
  kind: "labs" | "providers" | "lab" | "provider";
  reset: () => void;
}) {
  const title = kind === "lab" ? "Lab profile" : kind === "provider" ? "Provider profile" : kind === "labs" ? "Lab directory" : "Provider directory";

  return (
    <div className="shell-width py-20">
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-300" size={24} />
        <h1 className="mt-4 text-lg font-semibold text-white">{title} is temporarily unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          The catalogue could not be loaded. Check the API and database connection, then try again.
        </p>
        <button type="button" onClick={reset} className="control-button control-button-active mt-6">
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    </div>
  );
}
