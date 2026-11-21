import { isSearchableQuery, type SearchQuery } from "@/lib/validators/search";
import { mapModelSummary, type ModelSummaryRecord } from "@/server/mappers/model.mapper";
import { findModelSearchHits } from "@/server/repositories/models.repo";
import {
  findLabsForSearch,
  findModelsForSearch,
  findProvidersForSearch,
} from "@/server/repositories/search.repo";
import { emptySearchResult, orderRecordsBySearchHits } from "@/server/services/search.helpers";
import type { SearchDTO } from "@/types/api";

export async function searchCatalog(query: SearchQuery): Promise<SearchDTO> {
  const searchText = query.q;
  if (!isSearchableQuery(searchText)) {
    return emptySearchResult();
  }

  const [hits, labs, providers] = await Promise.all([
    findModelSearchHits(searchText),
    findLabsForSearch(searchText, query.limit),
    findProvidersForSearch(searchText, query.limit),
  ]);

  const limitedHits = hits.slice(0, query.limit);
  const modelRecords: ModelSummaryRecord[] = await findModelsForSearch(
    limitedHits.map((hit) => hit.id),
  );
  const orderedModels = orderRecordsBySearchHits(limitedHits, modelRecords);

  return {
    models: orderedModels.map(mapModelSummary),
    labs: labs.map((lab) => ({
      slug: lab.slug,
      name: lab.name,
      logoUrl: lab.logoUrl,
      modelCount: lab._count.models,
    })),
    providers: providers.map((provider) => ({
      slug: provider.slug,
      name: provider.name,
      modelCount: provider._count.offerings,
    })),
  };
}
