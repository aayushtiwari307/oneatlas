import type { SearchDTO } from "@/types/api";

export type SearchResultKind = "model" | "lab" | "provider";

export type SearchPaletteResult = {
  kind: SearchResultKind;
  slug: string;
  name: string;
  description: string;
  href: string;
};

export function flattenSearchResults(search: SearchDTO | undefined): SearchPaletteResult[] {
  if (!search) return [];

  return [
    ...search.models.map((model) => ({
      kind: "model" as const,
      slug: model.slug,
      name: model.name,
      description: `${model.lab.name} · ${model.type.toLowerCase()}`,
      href: `/models/${encodeURIComponent(model.slug)}`,
    })),
    ...search.labs.map((lab) => ({
      kind: "lab" as const,
      slug: lab.slug,
      name: lab.name,
      description: `${lab.modelCount} ${lab.modelCount === 1 ? "model" : "models"}`,
      href: `/labs/${encodeURIComponent(lab.slug)}`,
    })),
    ...search.providers.map((provider) => ({
      kind: "provider" as const,
      slug: provider.slug,
      name: provider.name,
      description: `${provider.modelCount} ${provider.modelCount === 1 ? "model" : "models"}`,
      href: `/providers/${encodeURIComponent(provider.slug)}`,
    })),
  ];
}

/** Moves the active result and wraps at either end of the result list. */
export function moveSearchSelection(current: number, direction: -1 | 1, count: number): number {
  if (count <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : count - 1;
  return (current + direction + count) % count;
}
