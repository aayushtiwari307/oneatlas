import type { BenchmarkCategory } from "@prisma/client";
import { notFound } from "@/lib/api/errors";
import {
  mapBenchmarkDTO,
  mapLabDetail,
  mapLabSummary,
  mapProviderDetail,
  mapProviderSummary,
} from "@/server/mappers/catalog.mapper";
import { findBenchmarks } from "@/server/repositories/benchmarks.repo";
import { findLabBySlug, findLabs } from "@/server/repositories/labs.repo";
import { findProviderBySlug, findProviders } from "@/server/repositories/providers.repo";
import type {
  BenchmarkDTO,
  LabDetailDTO,
  LabSummaryDTO,
  ProviderDetailDTO,
  ProviderSummaryDTO,
} from "@/types/api";

export async function listBenchmarks(category?: BenchmarkCategory): Promise<BenchmarkDTO[]> {
  const records = await findBenchmarks(category);
  return records.map(mapBenchmarkDTO);
}

export async function listLabs(): Promise<LabSummaryDTO[]> {
  const records = await findLabs();
  return records.map(mapLabSummary);
}

export async function getLabDetail(slug: string): Promise<LabDetailDTO> {
  const record = await findLabBySlug(slug);
  if (!record) {
    throw notFound("Lab");
  }
  return mapLabDetail(record);
}

export async function listProviders(): Promise<ProviderSummaryDTO[]> {
  const records = await findProviders();
  return records.map(mapProviderSummary);
}

export async function getProviderDetail(slug: string): Promise<ProviderDetailDTO> {
  const record = await findProviderBySlug(slug);
  if (!record) {
    throw notFound("Provider");
  }
  return mapProviderDetail(record);
}
