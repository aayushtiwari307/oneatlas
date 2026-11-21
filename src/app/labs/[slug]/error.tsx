"use client";

import { CatalogRouteError } from "@/components/catalog/catalog-route-error";

export default function LabDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CatalogRouteError kind="lab" reset={reset} />;
}
