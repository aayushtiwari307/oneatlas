"use client";

import { CatalogRouteError } from "@/components/catalog/catalog-route-error";

export default function ProvidersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CatalogRouteError kind="providers" reset={reset} />;
}
