import { z } from "zod";
import { Capability, Modality, ModelType, Prisma } from "@prisma/client";
import { normalizeCapabilities, normalizeModalities, normalizePricePerToken } from "../normalize";
import { slugify } from "../slug";

const OPENROUTER_MODELS_URL =
  "https://openrouter.ai/api/v1/models?output_modalities=all";

const nullablePositiveInteger = z.number().int().positive().nullable().optional();

/**
 * OpenRouter adds fields to this public response over time. Validate the fields
 * consumed by this app and preserve forward compatibility with passthrough().
 */
export const openRouterModelSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().nullable().optional(),
    created: z.number().int().nonnegative().nullable().optional(),
    context_length: nullablePositiveInteger,
    hugging_face_id: z.string().nullable().optional(),
    architecture: z
      .object({
        input_modalities: z.array(z.string()).optional().default([]),
        output_modalities: z.array(z.string()).optional().default([]),
      })
      .passthrough()
      .optional(),
    pricing: z
      .object({
        prompt: z.string(),
        completion: z.string(),
        input_cache_read: z.string().optional(),
      })
      .passthrough(),
    top_provider: z
      .object({
        context_length: nullablePositiveInteger,
        max_completion_tokens: nullablePositiveInteger,
      })
      .passthrough()
      .nullable()
      .optional(),
    supported_parameters: z.array(z.string()).optional().default([]),
  })
  .passthrough();

const openRouterEnvelopeSchema = z
  .object({ data: z.array(z.unknown()) })
  .passthrough();

export type NormalizedOpenRouterModel = {
  externalId: string;
  name: string;
  description: string | null;
  labSlug: string;
  labName: string;
  type: ModelType;
  releaseDate: Date | null;
  contextWindow: number | null;
  maxOutput: number | null;
  inputModalities: Modality[];
  outputModalities: Modality[];
  capabilities: Capability[];
  openWeights: boolean;
  inputPricePer1M: Prisma.Decimal;
  outputPricePer1M: Prisma.Decimal;
  cachedInputPricePer1M: Prisma.Decimal | null;
};

function titleFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function modelTypeFromOutput(sourceModalities: readonly string[]): ModelType {
  const outputs = new Set(sourceModalities.map((value) => value.trim().toLowerCase()));

  if (outputs.has("embeddings")) return ModelType.EMBEDDING;
  if (outputs.has("rerank")) return ModelType.RERANK;
  if (outputs.has("image")) return ModelType.IMAGE;
  if (outputs.has("audio") || outputs.has("speech") || outputs.has("transcription")) {
    return ModelType.AUDIO;
  }
  if (outputs.has("video")) return ModelType.VIDEO;
  return ModelType.CHAT;
}

/** Parse the top-level response while leaving per-model validation to the caller. */
export function parseOpenRouterEnvelope(input: unknown): unknown[] {
  return openRouterEnvelopeSchema.parse(input).data;
}

/** Convert one OpenRouter record into fields that map directly to Prisma models. */
export function normalizeOpenRouterModel(input: unknown): NormalizedOpenRouterModel {
  const model = openRouterModelSchema.parse(input);
  const inputSource = model.architecture?.input_modalities ?? [];
  const outputSource = model.architecture?.output_modalities ?? [];
  const inputModalities = normalizeModalities(inputSource);
  const outputModalities = normalizeModalities(outputSource);
  const idParts = model.id.split("/");
  const rawLabSlug = idParts.length > 1 ? idParts[0] : "openrouter";
  const labSlug = slugify(rawLabSlug);
  const createdDate =
    model.created == null ? null : new Date(model.created * 1_000);

  if (createdDate && Number.isNaN(createdDate.getTime())) {
    throw new Error(`Invalid created timestamp for OpenRouter model ${model.id}`);
  }

  const cachedPrice = model.pricing.input_cache_read;

  return {
    externalId: model.id,
    name: model.name,
    description: model.description ?? null,
    labSlug,
    labName: titleFromSlug(labSlug),
    type: modelTypeFromOutput(outputSource),
    releaseDate: createdDate,
    contextWindow:
      model.top_provider?.context_length ?? model.context_length ?? null,
    maxOutput: model.top_provider?.max_completion_tokens ?? null,
    inputModalities,
    outputModalities,
    capabilities: normalizeCapabilities(model.supported_parameters, inputModalities),
    openWeights: Boolean(model.hugging_face_id),
    inputPricePer1M: normalizePricePerToken(model.pricing.prompt),
    outputPricePer1M: normalizePricePerToken(model.pricing.completion),
    cachedInputPricePer1M: cachedPrice ? normalizePricePerToken(cachedPrice) : null,
  };
}

/** Fetch the public catalogue. No API key is required for this endpoint. */
export async function fetchOpenRouterModels(): Promise<unknown[]> {
  const response = await fetch(OPENROUTER_MODELS_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter models request failed with HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseOpenRouterEnvelope(payload);
}
