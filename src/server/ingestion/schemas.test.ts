import { describe, expect, it } from "vitest";
import benchmarks from "../../../data/curated/benchmarks.json";
import labs from "../../../data/curated/labs.json";
import models from "../../../data/curated/models.json";
import providers from "../../../data/curated/providers.json";
import scores from "../../../data/curated/scores.json";
import {
  curatedDatasetSchema,
  curatedLabSchema,
} from "./schemas";

const dataset = { labs, providers, benchmarks, models, scores };

describe("curated ingestion schemas", () => {
  it("accepts the complete offline curated dataset and its references", () => {
    const parsed = curatedDatasetSchema.parse(dataset);

    expect(parsed.labs).toHaveLength(15);
    expect(parsed.providers).toHaveLength(10);
    expect(parsed.benchmarks).toHaveLength(8);
    expect(parsed.models).toHaveLength(62);
    expect(new Set(parsed.scores.map((score) => score.modelSlug)).size).toBeGreaterThanOrEqual(25);
  });

  it("rejects duplicate lab slugs", () => {
    const result = curatedDatasetSchema.safeParse({
      ...dataset,
      labs: [labs[0], labs[0]],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a model that references an unknown lab", () => {
    const result = curatedDatasetSchema.safeParse({
      ...dataset,
      models: [{ ...models[0], labSlug: "not-a-real-lab" }, ...models.slice(1)],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Unknown labSlug"))).toBe(
        true,
      );
    }
  });

  it("rejects offerings that reference an unknown provider", () => {
    const firstModel = models[0];
    const result = curatedDatasetSchema.safeParse({
      ...dataset,
      models: [
        {
          ...firstModel,
          offerings: [
            { ...firstModel.offerings[0], providerSlug: "unknown-provider" },
          ],
        },
        ...models.slice(1),
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.message.includes("Unknown providerSlug")),
      ).toBe(true);
    }
  });

  it("rejects score rows that reference an unknown benchmark or model", () => {
    const result = curatedDatasetSchema.safeParse({
      ...dataset,
      scores: [
        {
          modelSlug: "missing-model",
          benchmarkSlug: "missing-benchmark",
          score: 50,
          source: "illustrative",
          measuredAt: null,
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Unknown modelSlug"))).toBe(
        true,
      );
      expect(
        result.error.issues.some((issue) => issue.message.includes("Unknown benchmarkSlug")),
      ).toBe(true);
    }
  });

  it("rejects unknown fields rather than silently accepting misspelled data", () => {
    expect(curatedLabSchema.safeParse({ ...labs[0], webiste: "https://example.com" }).success).toBe(
      false,
    );
  });

  it("rejects duplicate model/benchmark score pairs", () => {
    const score = scores[0];
    const result = curatedDatasetSchema.safeParse({ ...dataset, scores: [score, score] });

    expect(result.success).toBe(false);
  });
});
