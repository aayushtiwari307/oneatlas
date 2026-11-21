import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { computeModelMinPrices, type OfferingPrice } from "./recompute";

const offering = (
  inputPricePer1M: string,
  outputPricePer1M: string,
  isActive = true,
): OfferingPrice => ({
  inputPricePer1M: new Prisma.Decimal(inputPricePer1M),
  outputPricePer1M: new Prisma.Decimal(outputPricePer1M),
  isActive,
});

describe("computeModelMinPrices", () => {
  it("selects the active offering with the lowest input price", () => {
    const result = computeModelMinPrices([
      offering("0.8", "2.4"),
      offering("0.2", "1.1"),
      offering("0.4", "0.7"),
    ]);

    expect(result.minInputPrice?.toString()).toBe("0.2");
    expect(result.minOutputPrice?.toString()).toBe("1.1");
  });

  it("ignores inactive offerings even when they are cheaper", () => {
    const result = computeModelMinPrices([
      offering("0.01", "0.02", false),
      offering("0.3", "0.9", true),
    ]);

    expect(result.minInputPrice?.toString()).toBe("0.3");
    expect(result.minOutputPrice?.toString()).toBe("0.9");
  });

  it("uses both prices from the same cheapest-input offering", () => {
    const result = computeModelMinPrices([
      offering("0.1", "9"),
      offering("0.2", "0.01"),
    ]);

    expect(result.minInputPrice?.toString()).toBe("0.1");
    expect(result.minOutputPrice?.toString()).toBe("9");
  });

  it("uses lower output price as a deterministic tie-breaker", () => {
    const result = computeModelMinPrices([
      offering("0.1", "0.8"),
      offering("0.1", "0.4"),
    ]);

    expect(result.minInputPrice?.toString()).toBe("0.1");
    expect(result.minOutputPrice?.toString()).toBe("0.4");
  });

  it("returns null prices when there are no active offerings", () => {
    const result = computeModelMinPrices([offering("0.1", "0.2", false)]);

    expect(result).toEqual({ minInputPrice: null, minOutputPrice: null });
  });

  it("does not mutate the supplied offering list", () => {
    const rows = [offering("0.5", "1"), offering("0.2", "0.8")];
    const before = [...rows];

    computeModelMinPrices(rows);

    expect(rows).toEqual(before);
  });
});
