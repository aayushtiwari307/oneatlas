import type { ModelsQuery } from "@/lib/validators/models";
import {
  buildModelsOrderBy,
  buildModelsWhere,
  createPageMeta,
  resolveSort,
} from "@/lib/query/models-query";
import type { ModelDetailDTO, ModelSummaryDTO, PageResult } from "@/types/api";
import {
  findModelDetailBySlug,
  findModelSearchHits,
  findModelsForRelevance,
  findModelsPage,
  findSimilarModelsBySlug,
} from "@/server/repositories/models.repo";
import { mapModelDetail, mapModelSummary } from "@/server/mappers/model.mapper";

export async function listModels(query: ModelsQuery): Promise<PageResult<ModelSummaryDTO>> {
  const { sort, order } = resolveSort(query);
  const offset = (query.page - 1) * query.limit;
  const searchHits = query.q ? await findModelSearchHits(query.q) : undefined;

  if (searchHits && searchHits.length === 0) {
    return {
      data: [],
      meta: createPageMeta(query.page, query.limit, 0),
    };
  }

  const where = buildModelsWhere(
    query,
    searchHits?.map((hit) => hit.id),
  );

  if (sort === "relevance" && searchHits) {
    // Search is deliberately capped at 500 candidates; sorting this bounded set
    // in memory preserves the PostgreSQL relevance rank across pagination.
    const records = await findModelsForRelevance(where);
    const rankById = new Map(searchHits.map((hit) => [hit.id, hit.rank]));

    records.sort((left, right) => {
      const rankDifference = (rankById.get(right.id) ?? 0) - (rankById.get(left.id) ?? 0);
      return rankDifference || left.slug.localeCompare(right.slug);
    });

    return {
      data: records.slice(offset, offset + query.limit).map(mapModelSummary),
      meta: createPageMeta(query.page, query.limit, records.length),
    };
  }

  const { records, total } = await findModelsPage(
    where,
    buildModelsOrderBy(sort, order),
    offset,
    query.limit,
  );

  return {
    data: records.map(mapModelSummary),
    meta: createPageMeta(query.page, query.limit, total),
  };
}

export async function getModelDetail(slug: string): Promise<ModelDetailDTO | null> {
  const record = await findModelDetailBySlug(slug);
  return record ? mapModelDetail(record) : null;
}

export async function getSimilarModels(slug: string): Promise<ModelSummaryDTO[]> {
  const records = await findSimilarModelsBySlug(slug);
  return records.map(mapModelSummary);
}
