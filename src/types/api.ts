import type { BenchmarkCategory, Capability, Modality, ModelType } from "@prisma/client";

export type LabRef = { slug: string; name: string; logoUrl: string | null };

export type ModelSummaryDTO = {
  id: string;
  slug: string;
  name: string;
  lab: LabRef;
  type: ModelType;
  releaseDate: string | null;
  contextWindow: number | null;
  maxOutput: number | null;
  inputModalities: Modality[];
  outputModalities: Modality[];
  capabilities: Capability[];
  openWeights: boolean;
  minInputPrice: number | null;
  minOutputPrice: number | null;
  providerCount: number;
};

export type OfferingDTO = {
  provider: { slug: string; name: string };
  inputPricePer1M: number;
  outputPricePer1M: number;
  cachedInputPricePer1M: number | null;
  contextWindow: number | null;
  maxOutput: number | null;
  latencyMs: number | null;
  throughputTps: number | null;
  quantization: string | null;
};

export type BenchmarkRef = {
  slug: string;
  name: string;
  category: BenchmarkCategory;
  unit: string;
  higherIsBetter: boolean;
};

export type BenchmarkDTO = BenchmarkRef & { modelCount: number };

export type ScoreDTO = {
  benchmark: BenchmarkRef;
  score: number;
  source: string | null;
  measuredAt: string | null;
};

export type ModelDetailDTO = ModelSummaryDTO & {
  description: string | null;
  offerings: OfferingDTO[];
  scores: ScoreDTO[];
};

export type LabSummaryDTO = {
  slug: string;
  name: string;
  country: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  modelCount: number;
};

export type LabDetailDTO = LabSummaryDTO & { models: ModelSummaryDTO[] };

export type ProviderSummaryDTO = {
  slug: string;
  name: string;
  website: string | null;
  region: string | null;
  description: string | null;
  logoUrl: string | null;
  modelCount: number;
};

export type ProviderModelDTO = ModelSummaryDTO & { offering: OfferingDTO };
export type ProviderDetailDTO = ProviderSummaryDTO & { models: ProviderModelDTO[] };

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };
export type PageResult<T> = { data: T[]; meta: PageMeta };

export type CompareBenchmarkDTO = {
  benchmark: BenchmarkRef;
  scores: Record<string, number | null>;
  bestModelSlug: string | null;
};

export type ModelCompareDTO = { models: ModelSummaryDTO[]; benchmarks: CompareBenchmarkDTO[] };
export type RankingEntryDTO = { rank: number; score: number; model: ModelSummaryDTO };
export type RankingsDTO = { benchmark: BenchmarkRef; entries: RankingEntryDTO[] };

export type SearchLabDTO = {
  slug: string;
  name: string;
  logoUrl: string | null;
  modelCount: number;
};

export type SearchProviderDTO = {
  slug: string;
  name: string;
  modelCount: number;
};

export type SearchDTO = {
  models: ModelSummaryDTO[];
  labs: SearchLabDTO[];
  providers: SearchProviderDTO[];
};

export type FilterDirectoryDTO = { slug: string; name: string; count: number };
export type FilterValueDTO = { value: string; count: number };
export type FilterRangeDTO = { min: number | null; max: number | null };

export type FiltersDTO = {
  labs: FilterDirectoryDTO[];
  providers: FilterDirectoryDTO[];
  capabilities: FilterValueDTO[];
  types: FilterValueDTO[];
  modalities: FilterValueDTO[];
  contextRange: FilterRangeDTO;
  priceRange: FilterRangeDTO;
};

export type PricePerformancePointDTO = {
  slug: string;
  name: string;
  lab: Pick<LabRef, "slug" | "name">;
  score: number;
  /** USD per 1M tokens, weighted 75% input and 25% output. */
  blendedPrice: number;
};
