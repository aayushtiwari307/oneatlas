import type { SearchDTO } from "@/types/api";

export type SearchRankHit = { id: string; rank: number };

/** Reapply SQL relevance order because Prisma `IN` does not preserve caller order. */
export function orderRecordsBySearchHits<T extends { id: string }>(
  hits: readonly SearchRankHit[],
  records: readonly T[],
): T[] {
  const recordsById = new Map(records.map((record) => [record.id, record]));
  return hits.flatMap((hit) => {
    const record = recordsById.get(hit.id);
    return record === undefined ? [] : [record];
  });
}

export function emptySearchResult(): SearchDTO {
  return { models: [], labs: [], providers: [] };
}
