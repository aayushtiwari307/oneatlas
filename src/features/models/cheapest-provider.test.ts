import { describe, expect, it } from "vitest";
import type { OfferingDTO } from "@/types/api";
import { getCheapestProviderSlugs } from "./cheapest-provider";

const offering = (slug: string, price: number): OfferingDTO => ({
  provider: { slug, name: slug },
  inputPricePer1M: price,
  outputPricePer1M: price * 2,
  cachedInputPricePer1M: null,
  contextWindow: null,
  maxOutput: null,
  latencyMs: null,
  throughputTps: null,
  quantization: null,
});

describe("getCheapestProviderSlugs", () => {
  it("returns an empty list when there are no offerings", () => {
    expect(getCheapestProviderSlugs([])).toEqual([]);
  });

  it("returns the only provider when one offering exists", () => {
    expect(getCheapestProviderSlugs([offering("alpha", 2)])).toEqual(["alpha"]);
  });

  it("returns all providers tied at the lowest input price", () => {
    expect(getCheapestProviderSlugs([offering("zeta", 1), offering("alpha", 1), offering("beta", 4)])).toEqual(["alpha", "zeta"]);
  });

  it("does not select a provider based on output pricing", () => {
    const offerings = [offering("low-output", 2), offering("low-input", 1)];
    offerings[0].outputPricePer1M = 0.01;
    offerings[1].outputPricePer1M = 50;
    expect(getCheapestProviderSlugs(offerings)).toEqual(["low-input"]);
  });
});
