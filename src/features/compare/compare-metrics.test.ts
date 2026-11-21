import { describe, expect, it } from "vitest";
import { getBestCompareSlugs } from "./compare-metrics";

describe("compare metric highlighting", () => {
  it("highlights the lowest price", () => {
    expect(getBestCompareSlugs([
      { slug: "a", value: 2 },
      { slug: "b", value: 1 },
      { slug: "c", value: 3 },
    ], "lower")).toEqual(["b"]);
  });

  it("highlights all tied winners", () => {
    expect(getBestCompareSlugs([
      { slug: "a", value: 100 },
      { slug: "b", value: 100 },
      { slug: "c", value: 50 },
    ], "higher")).toEqual(["a", "b"]);
  });

  it("ignores null and non-finite values", () => {
    expect(getBestCompareSlugs([
      { slug: "a", value: null },
      { slug: "b", value: Number.NaN },
    ], "higher")).toEqual([]);
  });
});
