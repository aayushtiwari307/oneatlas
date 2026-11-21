import {
  Prisma,
  PrismaClient,
  RunStatus,
} from "@prisma/client";
import { ZodError } from "zod";
import { computeModelMinPrices } from "./recompute";
import { parseCuratedDataset, type CuratedDataset } from "./schemas";
import {
  fetchOpenRouterModels,
  normalizeOpenRouterModel,
} from "./sources/openrouter";
import { createUniqueModelSlug } from "./slug";

export type IngestionSummary = {
  source: string;
  fetched: number;
  upserted: number;
  rejected: number;
};

type IngestionClient = PrismaClient;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown ingestion error";
}

function errorJson(error: unknown): Prisma.InputJsonObject {
  if (error instanceof ZodError) {
    return {
      message: error.message,
      issues: error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  }
  return { message: errorMessage(error) };
}

function dateFromDateOnly(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function updateRunFailure(
  client: IngestionClient,
  runId: string,
  error: unknown,
  fetched: number,
  upserted: number,
  rejected: number,
): Promise<void> {
  await client.ingestionRun.update({
    where: { id: runId },
    data: {
      status: RunStatus.FAILED,
      finishedAt: new Date(),
      fetched,
      upserted,
      rejected: rejected + 1,
      errors: errorJson(error),
    },
  });
}

/**
 * Offline-first curated ingestion. Each upsert is idempotent and sequential;
 * this deliberately avoids a long interactive transaction during a large seed.
 */
export async function runCuratedIngestion(
  client: IngestionClient,
  input: unknown,
): Promise<IngestionSummary> {
  const run = await client.ingestionRun.create({
    data: { source: "curated", status: RunStatus.RUNNING },
  });

  let fetched = 0;
  let upserted = 0;
  const rejected = 0;

  try {
    const dataset: CuratedDataset = parseCuratedDataset(input);
    fetched =
      dataset.labs.length +
      dataset.providers.length +
      dataset.benchmarks.length +
      dataset.models.length +
      dataset.models.reduce((count, model) => count + model.offerings.length, 0) +
      dataset.scores.length;

    const labs = new Map<string, string>();
    for (const item of dataset.labs) {
      const saved = await client.lab.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          country: item.country,
          website: item.website,
          description: item.description,
        },
        update: {
          name: item.name,
          country: item.country,
          website: item.website,
          description: item.description,
        },
      });
      labs.set(item.slug, saved.id);
      upserted += 1;
    }

    const providers = new Map<string, string>();
    for (const item of dataset.providers) {
      const saved = await client.provider.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          website: item.website,
          region: item.region,
          description: item.description,
        },
        update: {
          name: item.name,
          website: item.website,
          region: item.region,
          description: item.description,
        },
      });
      providers.set(item.slug, saved.id);
      upserted += 1;
    }

    const benchmarks = new Map<string, string>();
    for (const item of dataset.benchmarks) {
      const saved = await client.benchmark.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          category: item.category,
          description: item.description,
          unit: item.unit,
          higherIsBetter: item.higherIsBetter,
          sourceUrl: item.sourceUrl,
        },
        update: {
          name: item.name,
          category: item.category,
          description: item.description,
          unit: item.unit,
          higherIsBetter: item.higherIsBetter,
          sourceUrl: item.sourceUrl,
        },
      });
      benchmarks.set(item.slug, saved.id);
      upserted += 1;
    }

    const touchedModelIds = new Set<string>();
    const modelSlugs = new Map<string, string>();
    for (const item of dataset.models) {
      const labId = labs.get(item.labSlug);
      if (!labId) {
        throw new Error(`Validated lab reference disappeared: ${item.labSlug}`);
      }

      const saved = await client.model.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          labId,
          type: item.type,
          releaseDate: dateFromDateOnly(item.releaseDate),
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          inputModalities: item.inputModalities,
          outputModalities: item.outputModalities,
          capabilities: item.capabilities,
          openWeights: item.openWeights,
        },
        update: {
          name: item.name,
          description: item.description,
          labId,
          type: item.type,
          releaseDate: dateFromDateOnly(item.releaseDate),
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          inputModalities: item.inputModalities,
          outputModalities: item.outputModalities,
          capabilities: item.capabilities,
          openWeights: item.openWeights,
        },
      });
      touchedModelIds.add(saved.id);
      modelSlugs.set(item.slug, saved.id);
      upserted += 1;

      for (const offering of item.offerings) {
        const providerId = providers.get(offering.providerSlug);
        if (!providerId) {
          throw new Error(`Validated provider reference disappeared: ${offering.providerSlug}`);
        }

        await client.modelProvider.upsert({
          where: {
            modelId_providerId: { modelId: saved.id, providerId },
          },
          create: {
            modelId: saved.id,
            providerId,
            inputPricePer1M: new Prisma.Decimal(offering.inputPricePer1M),
            outputPricePer1M: new Prisma.Decimal(offering.outputPricePer1M),
            cachedInputPricePer1M:
              offering.cachedInputPricePer1M === undefined
                ? null
                : new Prisma.Decimal(offering.cachedInputPricePer1M),
            contextWindow: offering.contextWindow ?? null,
            maxOutput: offering.maxOutput ?? null,
            latencyMs: offering.latencyMs ?? null,
            throughputTps: offering.throughputTps ?? null,
            quantization: offering.quantization ?? null,
            isActive: true,
          },
          update: {
            inputPricePer1M: new Prisma.Decimal(offering.inputPricePer1M),
            outputPricePer1M: new Prisma.Decimal(offering.outputPricePer1M),
            cachedInputPricePer1M:
              offering.cachedInputPricePer1M === undefined
                ? null
                : new Prisma.Decimal(offering.cachedInputPricePer1M),
            contextWindow: offering.contextWindow ?? null,
            maxOutput: offering.maxOutput ?? null,
            latencyMs: offering.latencyMs ?? null,
            throughputTps: offering.throughputTps ?? null,
            quantization: offering.quantization ?? null,
            isActive: true,
          },
        });
        upserted += 1;
      }
    }

    for (const score of dataset.scores) {
      const modelId = modelSlugs.get(score.modelSlug);
      const benchmarkId = benchmarks.get(score.benchmarkSlug);
      if (!modelId || !benchmarkId) {
        throw new Error(
          `Validated score reference disappeared: ${score.modelSlug}/${score.benchmarkSlug}`,
        );
      }

      await client.benchmarkScore.upsert({
        where: { modelId_benchmarkId: { modelId, benchmarkId } },
        create: {
          modelId,
          benchmarkId,
          score: score.score,
          source: score.source,
          measuredAt: dateFromDateOnly(score.measuredAt),
        },
        update: {
          score: score.score,
          source: score.source,
          measuredAt: dateFromDateOnly(score.measuredAt),
        },
      });
      upserted += 1;
    }

    await recomputeTouchedModelPrices(client, [...touchedModelIds]);

    await client.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: RunStatus.SUCCESS,
        finishedAt: new Date(),
        fetched,
        upserted,
        rejected,
      },
    });

    return { source: "curated", fetched, upserted, rejected };
  } catch (error) {
    await updateRunFailure(client, run.id, error, fetched, upserted, rejected);
    throw error;
  }
}

/** Recompute denormalized model prices from the cheapest active offering. */
export async function recomputeTouchedModelPrices(
  client: IngestionClient,
  modelIds: readonly string[],
): Promise<void> {
  for (const modelId of modelIds) {
    const offerings = await client.modelProvider.findMany({
      where: { modelId },
      select: {
        inputPricePer1M: true,
        outputPricePer1M: true,
        isActive: true,
      },
    });
    const prices = computeModelMinPrices(offerings);
    await client.model.update({ where: { id: modelId }, data: prices });
  }
}

/**
 * Optional live enrichment. Curated rows are never deleted; OpenRouter rows are
 * identified by Model.externalId and one aggregate `openrouter` provider.
 */
export async function runOpenRouterIngestion(
  client: IngestionClient,
  fetchModels: () => Promise<unknown[]> = fetchOpenRouterModels,
): Promise<IngestionSummary> {
  const run = await client.ingestionRun.create({
    data: { source: "openrouter", status: RunStatus.RUNNING },
  });

  let fetched = 0;
  let upserted = 0;
  let rejected = 0;
  const rejectedSamples: string[] = [];

  try {
    const rawModels = await fetchModels();
    fetched = rawModels.length;

    const provider = await client.provider.upsert({
      where: { slug: "openrouter" },
      create: {
        slug: "openrouter",
        name: "OpenRouter",
        website: "https://openrouter.ai",
        region: "Global",
        description: "Aggregated model routing and inference pricing from OpenRouter.",
      },
      update: {},
    });

    const existingModels = await client.model.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existingModels.map((model) => model.slug));
    const touchedModelIds = new Set<string>();

    for (const rawModel of rawModels) {
      let item: ReturnType<typeof normalizeOpenRouterModel>;
      try {
        item = normalizeOpenRouterModel(rawModel);
      } catch (error) {
        rejected += 1;
        if (rejectedSamples.length < 100) {
          rejectedSamples.push(errorMessage(error));
        }
        continue;
      }

      // Database errors are fatal to this run, not bad-source-row rejects.
      const lab = await client.lab.upsert({
        where: { slug: item.labSlug },
        create: {
          slug: item.labSlug,
          name: item.labName,
          country: null,
          website: null,
          description: null,
        },
        update: {},
      });

      const existing = await client.model.findUnique({
        where: { externalId: item.externalId },
        select: { slug: true },
      });
      const slug =
        existing?.slug ??
        createUniqueModelSlug(item.name, item.labSlug, existingSlugs);

      const savedModel = await client.model.upsert({
        where: { externalId: item.externalId },
        create: {
          externalId: item.externalId,
          slug,
          name: item.name,
          description: item.description,
          labId: lab.id,
          type: item.type,
          releaseDate: item.releaseDate,
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          inputModalities: item.inputModalities,
          outputModalities: item.outputModalities,
          capabilities: item.capabilities,
          openWeights: item.openWeights,
        },
        update: {
          name: item.name,
          description: item.description,
          labId: lab.id,
          type: item.type,
          releaseDate: item.releaseDate,
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          inputModalities: item.inputModalities,
          outputModalities: item.outputModalities,
          capabilities: item.capabilities,
          openWeights: item.openWeights,
        },
      });
      existingSlugs.add(savedModel.slug);
      touchedModelIds.add(savedModel.id);

      // OpenRouter reports one aggregate price per model, not separate
      // underlying provider offers. Do not imply provider-level price detail.
      await client.modelProvider.upsert({
        where: {
          modelId_providerId: {
            modelId: savedModel.id,
            providerId: provider.id,
          },
        },
        create: {
          modelId: savedModel.id,
          providerId: provider.id,
          inputPricePer1M: item.inputPricePer1M.toDecimalPlaces(6),
          outputPricePer1M: item.outputPricePer1M.toDecimalPlaces(6),
          cachedInputPricePer1M:
            item.cachedInputPricePer1M?.toDecimalPlaces(6) ?? null,
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          latencyMs: null,
          throughputTps: null,
          quantization: null,
          isActive: true,
        },
        update: {
          inputPricePer1M: item.inputPricePer1M.toDecimalPlaces(6),
          outputPricePer1M: item.outputPricePer1M.toDecimalPlaces(6),
          cachedInputPricePer1M:
            item.cachedInputPricePer1M?.toDecimalPlaces(6) ?? null,
          contextWindow: item.contextWindow,
          maxOutput: item.maxOutput,
          latencyMs: null,
          throughputTps: null,
          quantization: null,
          isActive: true,
        },
      });

      upserted += 1;
    }

    await recomputeTouchedModelPrices(client, [...touchedModelIds]);

    const status = rejected === 0 ? RunStatus.SUCCESS : RunStatus.PARTIAL;
    await client.ingestionRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        fetched,
        upserted,
        rejected,
        errors: rejectedSamples.length > 0 ? { samples: rejectedSamples } : Prisma.JsonNull,
      },
    });

    return { source: "openrouter", fetched, upserted, rejected };
  } catch (error) {
    await updateRunFailure(client, run.id, error, fetched, upserted, rejected);
    throw error;
  }
}
