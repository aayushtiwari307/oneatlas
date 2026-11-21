import type { Prisma } from "@prisma/client";
import type { ModelsQuery } from "@/lib/validators/models";

export type ModelSort = NonNullable<ModelsQuery["sort"]>;
export type SortOrder = "asc" | "desc";

export type ResolvedModelSort = {
  sort: ModelSort;
  order: SortOrder;
};

const DEFAULT_ORDER: Record<ModelSort, SortOrder> = {
  name: "asc",
  price: "asc",
  context: "desc",
  release: "desc",
  relevance: "desc",
};

/** Resolve the documented defaults without mutating the parsed query. */
export function resolveSort(query: ModelsQuery): ResolvedModelSort {
  const requestedSort = query.sort ?? (query.q ? "relevance" : "release");
  const sort = requestedSort === "relevance" && !query.q ? "release" : requestedSort;

  return {
    sort,
    order: query.order ?? DEFAULT_ORDER[sort],
  };
}

/** Build a Prisma where clause; every supplied filter is combined with AND. */
export function buildModelsWhere(
  query: ModelsQuery,
  idsFromSearch?: readonly string[],
): Prisma.ModelWhereInput {
  const where: Prisma.ModelWhereInput = {};

  if (idsFromSearch !== undefined) {
    where.id = { in: [...idsFromSearch] };
  }

  if (query.lab?.length) {
    where.lab = { is: { slug: { in: query.lab } } };
  }

  if (query.provider?.length) {
    where.offerings = {
      some: {
        isActive: true,
        provider: { is: { slug: { in: query.provider } } },
      },
    };
  }

  if (query.capability?.length) {
    where.capabilities = { hasEvery: query.capability };
  }

  if (query.modality?.length) {
    where.inputModalities = { hasEvery: query.modality };
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.minContext !== undefined) {
    where.contextWindow = { gte: query.minContext };
  }

  if (query.maxPrice !== undefined) {
    // A nullable comparison naturally excludes models without a known price.
    where.minInputPrice = { lte: query.maxPrice };
  }

  return where;
}

/** Escape LIKE metacharacters while leaving the surrounding wildcard to SQL. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Stable DB ordering: every sort ends with the unique model slug. */
export function buildModelsOrderBy(
  sort: ModelSort,
  order: SortOrder,
): Prisma.ModelOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: order }, { slug: "asc" }];
    case "price":
      return [{ minInputPrice: { sort: order, nulls: "last" } }, { slug: "asc" }];
    case "context":
      return [{ contextWindow: { sort: order, nulls: "last" } }, { slug: "asc" }];
    case "release":
      return [{ releaseDate: { sort: order, nulls: "last" } }, { slug: "asc" }];
    case "relevance":
      // Relevance order is applied in memory after the capped search result set
      // has been filtered by Prisma.
      return [{ slug: "asc" }];
  }
}

export function createPageMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
