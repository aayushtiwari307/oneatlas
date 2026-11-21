import {
  BenchmarkCategory,
  Capability,
  Modality,
  ModelType,
} from "@prisma/client";
import { z } from "zod";

// Derive enum values from the generated Prisma client so ingestion validation
// cannot drift away from the database schema.
const MODEL_TYPES = Object.values(ModelType) as [ModelType, ...ModelType[]];
const MODALITIES = Object.values(Modality) as [Modality, ...Modality[]];
const CAPABILITIES = Object.values(Capability) as [Capability, ...Capability[]];
const BENCHMARK_CATEGORIES = Object.values(BenchmarkCategory) as [
  BenchmarkCategory,
  ...BenchmarkCategory[],
];

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case slug");

const nonEmptyTextSchema = z.string().trim().min(1).max(500);
const nullableTextSchema = z.string().trim().max(5_000).nullable();
const urlSchema = z.string().url().max(2_048);
const positiveIntegerSchema = z.number().int().positive().finite();
const nullablePositiveIntegerSchema = positiveIntegerSchema.nullable();
const nonNegativeNumberSchema = z.number().finite().nonnegative();

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Expected a real calendar date");

export const curatedLabSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyTextSchema,
    country: nonEmptyTextSchema.nullable(),
    website: urlSchema.nullable(),
    description: nullableTextSchema,
  })
  .strict();

export const curatedProviderSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyTextSchema,
    website: urlSchema.nullable(),
    region: nonEmptyTextSchema.nullable(),
    description: nullableTextSchema,
  })
  .strict();

export const curatedBenchmarkSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyTextSchema,
    category: z.enum(BENCHMARK_CATEGORIES),
    description: nullableTextSchema,
    unit: nonEmptyTextSchema,
    higherIsBetter: z.boolean(),
    sourceUrl: urlSchema.nullable(),
  })
  .strict();

export const curatedOfferingSchema = z
  .object({
    providerSlug: slugSchema,
    inputPricePer1M: nonNegativeNumberSchema,
    outputPricePer1M: nonNegativeNumberSchema,
    cachedInputPricePer1M: nonNegativeNumberSchema.optional(),
    contextWindow: positiveIntegerSchema.optional(),
    maxOutput: positiveIntegerSchema.optional(),
    latencyMs: positiveIntegerSchema.optional(),
    throughputTps: nonNegativeNumberSchema.optional(),
    quantization: nonEmptyTextSchema.optional(),
  })
  .strict();

export const curatedModelSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyTextSchema,
    labSlug: slugSchema,
    type: z.enum(MODEL_TYPES),
    releaseDate: dateOnlySchema.nullable(),
    contextWindow: nullablePositiveIntegerSchema,
    maxOutput: nullablePositiveIntegerSchema,
    inputModalities: z.array(z.enum(MODALITIES)).max(MODALITIES.length),
    outputModalities: z.array(z.enum(MODALITIES)).max(MODALITIES.length),
    capabilities: z.array(z.enum(CAPABILITIES)).max(CAPABILITIES.length),
    openWeights: z.boolean(),
    description: nullableTextSchema,
    offerings: z.array(curatedOfferingSchema).max(4),
  })
  .strict();

export const curatedScoreSchema = z
  .object({
    modelSlug: slugSchema,
    benchmarkSlug: slugSchema,
    score: z.number().finite(),
    source: nonEmptyTextSchema,
    measuredAt: dateOnlySchema.nullable().optional(),
  })
  .strict();

const curatedLabsSchema = z.array(curatedLabSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({ code: "custom", path: [index, "slug"], message: `Duplicate slug: ${item.slug}` });
    }
    seen.add(item.slug);
  });
});

const curatedProvidersSchema = z.array(curatedProviderSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({ code: "custom", path: [index, "slug"], message: `Duplicate slug: ${item.slug}` });
    }
    seen.add(item.slug);
  });
});

const curatedBenchmarksSchema = z.array(curatedBenchmarkSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({ code: "custom", path: [index, "slug"], message: `Duplicate slug: ${item.slug}` });
    }
    seen.add(item.slug);
  });
});

const curatedModelsSchema = z.array(curatedModelSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({ code: "custom", path: [index, "slug"], message: `Duplicate slug: ${item.slug}` });
    }
    seen.add(item.slug);
  });
});

export const curatedDatasetSchema = z
  .object({
    labs: curatedLabsSchema,
    providers: curatedProvidersSchema,
    benchmarks: curatedBenchmarksSchema,
    models: curatedModelsSchema,
    scores: z.array(curatedScoreSchema),
  })
  .strict()
  .superRefine((dataset, ctx) => {
    const labSlugs = new Set(dataset.labs.map((lab) => lab.slug));
    const providerSlugs = new Set(dataset.providers.map((provider) => provider.slug));
    const benchmarkSlugs = new Set(dataset.benchmarks.map((benchmark) => benchmark.slug));
    const modelSlugs = new Set(dataset.models.map((model) => model.slug));

    dataset.models.forEach((model, modelIndex) => {
      if (!labSlugs.has(model.labSlug)) {
        ctx.addIssue({
          code: "custom",
          path: ["models", modelIndex, "labSlug"],
          message: `Unknown labSlug reference: ${model.labSlug}`,
        });
      }

      const seenProviderSlugs = new Set<string>();
      model.offerings.forEach((offering, offeringIndex) => {
        if (!providerSlugs.has(offering.providerSlug)) {
          ctx.addIssue({
            code: "custom",
            path: ["models", modelIndex, "offerings", offeringIndex, "providerSlug"],
            message: `Unknown providerSlug reference: ${offering.providerSlug}`,
          });
        }

        if (seenProviderSlugs.has(offering.providerSlug)) {
          ctx.addIssue({
            code: "custom",
            path: ["models", modelIndex, "offerings", offeringIndex, "providerSlug"],
            message: `Duplicate provider offering: ${offering.providerSlug}`,
          });
        }
        seenProviderSlugs.add(offering.providerSlug);
      });
    });

    const seenScoreKeys = new Set<string>();
    dataset.scores.forEach((score, scoreIndex) => {
      if (!modelSlugs.has(score.modelSlug)) {
        ctx.addIssue({
          code: "custom",
          path: ["scores", scoreIndex, "modelSlug"],
          message: `Unknown modelSlug reference: ${score.modelSlug}`,
        });
      }

      if (!benchmarkSlugs.has(score.benchmarkSlug)) {
        ctx.addIssue({
          code: "custom",
          path: ["scores", scoreIndex, "benchmarkSlug"],
          message: `Unknown benchmarkSlug reference: ${score.benchmarkSlug}`,
        });
      }

      const scoreKey = `${score.modelSlug}:${score.benchmarkSlug}`;
      if (seenScoreKeys.has(scoreKey)) {
        ctx.addIssue({
          code: "custom",
          path: ["scores", scoreIndex],
          message: `Duplicate score for model/benchmark pair: ${scoreKey}`,
        });
      }
      seenScoreKeys.add(scoreKey);
    });
  });

export type CuratedDataset = z.infer<typeof curatedDatasetSchema>;
export type CuratedLab = z.infer<typeof curatedLabSchema>;
export type CuratedProvider = z.infer<typeof curatedProviderSchema>;
export type CuratedBenchmark = z.infer<typeof curatedBenchmarkSchema>;
export type CuratedModel = z.infer<typeof curatedModelSchema>;
export type CuratedOffering = z.infer<typeof curatedOfferingSchema>;
export type CuratedScore = z.infer<typeof curatedScoreSchema>;

/** Parse all five files together so cross-file references are validated at once. */
export function parseCuratedDataset(input: unknown): CuratedDataset {
  return curatedDatasetSchema.parse(input);
}
