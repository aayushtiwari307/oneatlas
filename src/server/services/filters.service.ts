import { mapFilterRepositoryRecords } from "@/server/mappers/filters.mapper";
import { findFilterRepositoryRecords } from "@/server/repositories/filters.repo";
import type { FiltersDTO } from "@/types/api";

export async function getFilters(): Promise<FiltersDTO> {
  const records = await findFilterRepositoryRecords();
  return mapFilterRepositoryRecords(records);
}
