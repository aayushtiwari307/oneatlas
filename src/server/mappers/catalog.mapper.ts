import type { BenchmarkListRecord } from "@/server/repositories/benchmarks.repo";
import type { LabDetailRecord, LabListRecord } from "@/server/repositories/labs.repo";
import type { ProviderDetailRecord, ProviderListRecord } from "@/server/repositories/providers.repo";
import { mapModelSummary } from "@/server/mappers/model.mapper";
import type {
  BenchmarkDTO,
  LabDetailDTO,
  LabSummaryDTO,
  OfferingDTO,
  ProviderDetailDTO,
  ProviderSummaryDTO,
} from "@/types/api";

export function mapBenchmarkDTO(record: BenchmarkListRecord): BenchmarkDTO {
  return {
    slug: record.slug,
    name: record.name,
    category: record.category,
    unit: record.unit,
    higherIsBetter: record.higherIsBetter,
    modelCount: record._count.scores,
  };
}

export function mapLabSummary(record: LabListRecord): LabSummaryDTO {
  return {
    slug: record.slug,
    name: record.name,
    country: record.country,
    website: record.website,
    description: record.description,
    logoUrl: record.logoUrl,
    modelCount: record._count.models,
  };
}

export function mapLabDetail(record: LabDetailRecord): LabDetailDTO {
  return {
    ...mapLabSummary(record),
    models: record.models.map(mapModelSummary),
  };
}

export function mapProviderSummary(record: ProviderListRecord): ProviderSummaryDTO {
  return {
    slug: record.slug,
    name: record.name,
    website: record.website,
    region: record.region,
    description: record.description,
    logoUrl: record.logoUrl,
    modelCount: record._count.offerings,
  };
}

function mapProviderOffering(
  record: ProviderDetailRecord["offerings"][number],
  provider: ProviderDetailRecord,
): OfferingDTO {
  return {
    provider: { slug: provider.slug, name: provider.name },
    inputPricePer1M: record.inputPricePer1M.toNumber(),
    outputPricePer1M: record.outputPricePer1M.toNumber(),
    cachedInputPricePer1M: record.cachedInputPricePer1M?.toNumber() ?? null,
    contextWindow: record.contextWindow,
    maxOutput: record.maxOutput,
    latencyMs: record.latencyMs,
    throughputTps: record.throughputTps,
    quantization: record.quantization,
  };
}

export function mapProviderDetail(record: ProviderDetailRecord): ProviderDetailDTO {
  return {
    ...mapProviderSummary(record),
    models: record.offerings.map((offering) => ({
      ...mapModelSummary(offering.model),
      offering: mapProviderOffering(offering, record),
    })),
  };
}
