"use client";

import { CatalogRouteError } from "@/components/catalog/catalog-route-error";

export default function ProviderDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CatalogRouteError kind="provider" reset={reset} />;
}
