import type { Model, Prisma } from "@prisma/client";
import type {
  ModelDetailDTO,
  ModelSummaryDTO,
  OfferingDTO,
  ScoreDTO,
} from "@/types/api";

export const modelSummaryArgs = {
  include: {
    lab: {
      select: {
        slug: true,
        name: true,
        logoUrl: true,
      },
    },
    offerings: {
      where: { isActive: true },
      select: { id: true },
    },
  },
} satisfies Prisma.ModelDefaultArgs;

export const modelDetailArgs = {
  include: {
    lab: {
      select: {
        slug: true,
        name: true,
        logoUrl: true,
      },
    },
    offerings: {
      where: { isActive: true },
      orderBy: [
        { inputPricePer1M: "asc" },
        { provider: { slug: "asc" } },
      ],
      select: {
        provider: {
          select: {
            slug: true,
            name: true,
          },
        },
        inputPricePer1M: true,
        outputPricePer1M: true,
        cachedInputPricePer1M: true,
        contextWindow: true,
        maxOutput: true,
        latencyMs: true,
        throughputTps: true,
        quantization: true,
      },
    },
    scores: {
      orderBy: [
        { benchmark: { category: "asc" } },
        { benchmark: { name: "asc" } },
      ],
      include: {
        benchmark: {
          select: {
            slug: true,
            name: true,
            category: true,
            unit: true,
            higherIsBetter: true,
          },
        },
      },
    },
  },
} satisfies Prisma.ModelDefaultArgs;

export type ModelSummaryRecord = Prisma.ModelGetPayload<typeof modelSummaryArgs>;
export type ModelDetailRecord = Prisma.ModelGetPayload<typeof modelDetailArgs>;

type ModelCoreRecord = Pick<
  Model,
  | "id"
  | "slug"
  | "name"
  | "type"
  | "releaseDate"
  | "contextWindow"
  | "maxOutput"
  | "inputModalities"
  | "outputModalities"
  | "capabilities"
  | "openWeights"
  | "minInputPrice"
  | "minOutputPrice"
> & {
  lab: {
    slug: string;
    name: string;
    logoUrl: string | null;
  };
  offerings: readonly unknown[];
};

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

function mapModelCore(record: ModelCoreRecord): ModelSummaryDTO {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    lab: record.lab,
    type: record.type,
    releaseDate: record.releaseDate?.toISOString() ?? null,
    contextWindow: record.contextWindow,
    maxOutput: record.maxOutput,
    inputModalities: record.inputModalities,
    outputModalities: record.outputModalities,
    capabilities: record.capabilities,
    openWeights: record.openWeights,
    minInputPrice: decimalToNumber(record.minInputPrice),
    minOutputPrice: decimalToNumber(record.minOutputPrice),
    providerCount: record.offerings.length,
  };
}

export function mapModelSummary(record: ModelSummaryRecord): ModelSummaryDTO {
  return mapModelCore(record);
}

function mapOffering(record: ModelDetailRecord["offerings"][number]): OfferingDTO {
  return {
    provider: record.provider,
    inputPricePer1M: record.inputPricePer1M.toNumber(),
    outputPricePer1M: record.outputPricePer1M.toNumber(),
    cachedInputPricePer1M: decimalToNumber(record.cachedInputPricePer1M),
    contextWindow: record.contextWindow,
    maxOutput: record.maxOutput,
    latencyMs: record.latencyMs,
    throughputTps: record.throughputTps,
    quantization: record.quantization,
  };
}

function mapScore(record: ModelDetailRecord["scores"][number]): ScoreDTO {
  return {
    benchmark: record.benchmark,
    score: record.score,
    source: record.source,
    measuredAt: record.measuredAt?.toISOString() ?? null,
  };
}

export function mapModelDetail(record: ModelDetailRecord): ModelDetailDTO {
  return {
    ...mapModelCore(record),
    description: record.description,
    offerings: record.offerings.map(mapOffering),
    scores: record.scores.map(mapScore),
  };
}
