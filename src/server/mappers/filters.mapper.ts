import type { FilterRepositoryRecords } from "@/server/repositories/filters.repo";
import type { FiltersDTO } from "@/types/api";

export type FilterFacetSource = {
  labs: Array<{ slug: string; name: string; count: number }>;
  providers: Array<{ slug: string; name: string; count: number }>;
  models: Array<{
    capabilities: readonly string[];
    inputModalities: readonly string[];
    type: string;
    contextWindow: number | null;
    minInputPrice: number | null;
  }>;
};

function countedValues(values: readonly string[]): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

function range(values: readonly number[]): { min: number | null; max: number | null } {
  if (values.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** Pure aggregation: counts are global catalogue counts, not faceted counts. */
export function buildFiltersDTO(source: FilterFacetSource): FiltersDTO {
  const capabilities = source.models.flatMap((model) => [...new Set(model.capabilities)]);
  const modalities = source.models.flatMap((model) => [...new Set(model.inputModalities)]);
  const types = source.models.map((model) => model.type);
  const contextWindows = source.models.flatMap((model) =>
    model.contextWindow === null ? [] : [model.contextWindow],
  );
  const prices = source.models.flatMap((model) =>
    model.minInputPrice === null ? [] : [model.minInputPrice],
  );

  return {
    labs: source.labs.map((lab) => ({ ...lab })),
    providers: source.providers.map((provider) => ({ ...provider })),
    capabilities: countedValues(capabilities),
    types: countedValues(types),
    modalities: countedValues(modalities),
    contextRange: range(contextWindows),
    priceRange: range(prices),
  };
}

/** Convert Prisma Decimal values only at this mapper boundary. */
export function mapFilterRepositoryRecords(records: FilterRepositoryRecords): FiltersDTO {
  return buildFiltersDTO({
    labs: records.labs.map((lab) => ({
      slug: lab.slug,
      name: lab.name,
      count: lab._count.models,
    })),
    providers: records.providers.map((provider) => ({
      slug: provider.slug,
      name: provider.name,
      count: provider._count.offerings,
    })),
    models: records.models.map((model) => ({
      capabilities: model.capabilities,
      inputModalities: model.inputModalities,
      type: model.type,
      contextWindow: model.contextWindow,
      minInputPrice: model.minInputPrice?.toNumber() ?? null,
    })),
  });
}
