import { describe, expect, it } from "vitest";
import { estimateMonthlyCost } from "./monthly-cost";

describe("estimateMonthlyCost", () => {
  it("returns zero when both token volumes are zero", () => {
    expect(estimateMonthlyCost({ inputTokens: 0, outputTokens: 0, inputPricePer1M: 3, outputPricePer1M: 15 })).toBe(0);
  });

  it("calculates input and output spend per million tokens", () => {
    expect(estimateMonthlyCost({ inputTokens: 2_000_000, outputTokens: 500_000, inputPricePer1M: 2, outputPricePer1M: 8 })).toBe(8);
  });

  it("rounds the total to the nearest cent", () => {
    expect(estimateMonthlyCost({ inputTokens: 333_333, outputTokens: 111_111, inputPricePer1M: 0.123456, outputPricePer1M: 0.654321 })).toBe(0.11);
  });

  it("handles large monthly token volumes without integer overflow", () => {
    expect(estimateMonthlyCost({ inputTokens: 1_000_000_000_000, outputTokens: 250_000_000_000, inputPricePer1M: 1.5, outputPricePer1M: 6 })).toBe(3_000_000);
  });

  it("accepts zero prices", () => {
    expect(estimateMonthlyCost({ inputTokens: 9_000_000, outputTokens: 2_000_000, inputPricePer1M: 0, outputPricePer1M: 0 })).toBe(0);
  });

  it("rejects negative values", () => {
    expect(() => estimateMonthlyCost({ inputTokens: -1, outputTokens: 0, inputPricePer1M: 1, outputPricePer1M: 1 })).toThrow(RangeError);
  });

  it("rejects non-finite values", () => {
    expect(() => estimateMonthlyCost({ inputTokens: Number.POSITIVE_INFINITY, outputTokens: 0, inputPricePer1M: 1, outputPricePer1M: 1 })).toThrow(RangeError);
  });
});
