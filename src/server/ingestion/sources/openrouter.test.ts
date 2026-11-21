import { describe, expect, it } from "vitest";
import { Capability, Modality, ModelType } from "@prisma/client";
import {
  normalizeOpenRouterModel,
  openRouterModelSchema,
  parseOpenRouterEnvelope,
} from "./openrouter";

const sampleModel = {
  id: "acme/vision-assistant",
  name: "Acme: Vision Assistant",
  description: "A sample multimodal model.",
  created: 1_700_000_000,
  context_length: 128_000,
  hugging_face_id: "acme/vision-assistant",
  architecture: {
    modality: "text+image->text",
    input_modalities: ["text", "image", "audio", "text"],
    output_modalities: ["text"],
    tokenizer: "Other",
  },
  pricing: {
    prompt: "0.000000091",
    completion: "0.000000362",
    input_cache_read: "0.000000018",
  },
  top_provider: {
    context_length: 64_000,
    max_completion_tokens: 8_000,
    is_moderated: false,
  },
  supported_parameters: ["tools", "reasoning", "structured_outputs", "web_search"],
  an_unrecognized_future_field: { value: true },
};

describe("OpenRouter source normalization", () => {
  it("accepts new API fields without rejecting the model", () => {
    expect(openRouterModelSchema.parse(sampleModel).id).toBe("acme/vision-assistant");
  });

  it("maps API fields to Prisma-aligned model metadata", () => {
    const result = normalizeOpenRouterModel(sampleModel);

    expect(result.externalId).toBe("acme/vision-assistant");
    expect(result.labSlug).toBe("acme");
    expect(result.labName).toBe("Acme");
    expect(result.contextWindow).toBe(64_000);
    expect(result.maxOutput).toBe(8_000);
    expect(result.type).toBe(ModelType.CHAT);
    expect(result.inputModalities).toEqual([Modality.TEXT, Modality.IMAGE, Modality.AUDIO]);
    expect(result.capabilities).toEqual([
      Capability.TOOLS,
      Capability.REASONING,
      Capability.STRUCTURED_OUTPUT,
      Capability.WEB_SEARCH,
      Capability.VISION,
    ]);
    expect(result.openWeights).toBe(true);
    expect(result.releaseDate?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
  });

  it("converts per-token prices to exact per-million Decimal values", () => {
    const result = normalizeOpenRouterModel(sampleModel);

    expect(result.inputPricePer1M.toString()).toBe("0.091");
    expect(result.outputPricePer1M.toString()).toBe("0.362");
    expect(result.cachedInputPricePer1M?.toString()).toBe("0.018");
  });

  it("rejects negative dynamic pricing sentinels", () => {
    const dynamicPriceModel = {
      ...sampleModel,
      pricing: { ...sampleModel.pricing, prompt: "-1" },
    };

    expect(() => normalizeOpenRouterModel(dynamicPriceModel)).toThrow(
      "finite non-negative decimal string",
    );
  });

  it("maps embedding, rerank, image and audio output types", () => {
    const withOutput = (output: string) =>
      normalizeOpenRouterModel({
        ...sampleModel,
        architecture: {
          ...sampleModel.architecture,
          output_modalities: [output],
        },
      }).type;

    expect(withOutput("embeddings")).toBe(ModelType.EMBEDDING);
    expect(withOutput("rerank")).toBe(ModelType.RERANK);
    expect(withOutput("image")).toBe(ModelType.IMAGE);
    expect(withOutput("speech")).toBe(ModelType.AUDIO);
    expect(withOutput("video")).toBe(ModelType.VIDEO);
  });

  it("parses the list envelope and ignores additional envelope fields", () => {
    expect(parseOpenRouterEnvelope({ data: [sampleModel], total: 1 })).toHaveLength(1);
  });

  it("rejects a malformed model record", () => {
    expect(() => normalizeOpenRouterModel({ ...sampleModel, pricing: {} })).toThrow();
  });
});
