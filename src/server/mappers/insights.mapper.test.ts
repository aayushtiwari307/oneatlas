import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { PricePerformanceRecord } from "@/server/repositories/insights.repo";
import { mapPricePerformancePoint } from "./insights.mapper";

function record(input: number, output: number, score = 82): PricePerformanceRecord {
  return {
    slug: "sample-model",
    name: "Sample Model",
    lab: { slug: "sample-lab", name: "Sample Lab" },
    offerings: [{
      inputPricePer1M: new Prisma.Decimal(input),
      outputPricePer1M: new Prisma.Decimal(output),
    }],
    scores: [{ score, source: "illustrative" }],
  };
}

describe("mapPricePerformancePoint", () => {
  it("applies a 75/25 input-output blended price", () => {
    expect(mapPricePerformancePoint(record(2, 10))?.blendedPrice).toBe(4);
  });

  it("preserves the model, lab and benchmark score values", () => {
    expect(mapPricePerformancePoint(record(1, 5, 91))).toMatchObject({
      slug: "sample-model",
      name: "Sample Model",
      lab: { slug: "sample-lab", name: "Sample Lab" },
      score: 91,
    });
  });

  it("returns null if a cheapest offering is absent", () => {
    expect(mapPricePerformancePoint({ ...record(1, 2), offerings: [] })).toBeNull();
  });

  it("returns null if a benchmark score is absent", () => {
    expect(mapPricePerformancePoint({ ...record(1, 2), scores: [] })).toBeNull();
  });
});
