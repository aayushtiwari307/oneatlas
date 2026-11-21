import { describe, expect, it } from "vitest";
import { pricePerformanceQuerySchema } from "./insights";

describe("pricePerformanceQuerySchema", () => {
  it("accepts an omitted benchmark", () => {
    expect(pricePerformanceQuerySchema.parse({})).toEqual({ benchmark: undefined });
  });

  it("normalizes a blank benchmark to omitted", () => {
    expect(pricePerformanceQuerySchema.parse({ benchmark: "  " })).toEqual({ benchmark: undefined });
  });

  it("accepts a kebab-case benchmark slug", () => {
    expect(pricePerformanceQuerySchema.parse({ benchmark: "mmlu-pro" }).benchmark).toBe("mmlu-pro");
  });

  it("rejects malformed benchmark slugs", () => {
    expect(pricePerformanceQuerySchema.safeParse({ benchmark: "MMLU Pro" }).success).toBe(false);
  });

  it("rejects unknown query parameters", () => {
    expect(pricePerformanceQuerySchema.safeParse({ unexpected: "value" }).success).toBe(false);
  });
});
