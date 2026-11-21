import { describe, expect, it } from "vitest";
import type { PricePerformancePointDTO } from "@/types/api";
import { layoutScatterPoints } from "./scatter-layout";

const point = (slug: string, blendedPrice: number, score: number): PricePerformancePointDTO => ({
  slug,
  name: slug,
  lab: { slug: "lab", name: "Lab" },
  score,
  blendedPrice,
});

describe("layoutScatterPoints", () => {
  it("returns no points for an empty dataset", () => {
    expect(layoutScatterPoints([], true, 400, 240)).toEqual([]);
  });

  it("places lower prices to the left", () => {
    const result = layoutScatterPoints([point("cheap", 1, 50), point("expensive", 5, 60)], true, 400, 240);
    expect(result[0].x).toBeLessThan(result[1].x);
  });

  it("places higher scores higher when higher is better", () => {
    const result = layoutScatterPoints([point("low", 1, 10), point("high", 1, 90)], true, 400, 240);
    expect(result[1].y).toBeLessThan(result[0].y);
  });

  it("places lower scores higher when lower is better", () => {
    const result = layoutScatterPoints([point("low", 1, 10), point("high", 1, 90)], false, 400, 240);
    expect(result[0].y).toBeLessThan(result[1].y);
  });

  it("centers values when both axes have a single value", () => {
    const result = layoutScatterPoints([point("only", 2, 80)], true, 400, 240);
    expect(result[0].x).toBe(200);
    expect(result[0].y).toBe(120);
  });

  it("drops invalid negative prices and non-finite scores", () => {
    const result = layoutScatterPoints([
      point("valid", 1, 10),
      point("negative", -1, 20),
      point("invalid", 2, Number.NaN),
    ], true, 400, 240);
    expect(result.map((item) => item.slug)).toEqual(["valid"]);
  });
});
