"use client";

import { CatalogRouteError } from "@/components/catalog/catalog-route-error";

export default function LabsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <CatalogRouteError kind="labs" reset={reset} />;
}
